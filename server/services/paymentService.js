const User = require('../models/User');
const Payment = require('../models/Payment');
const { calculateAmount, createOrder, verifyPaymentSignature, getRazorpayKeyId, verifyWebhookSignature } = require('../utils/razorpayHelper');
const { sendEmail } = require('../utils/emailService');
const ApiError = require('../utils/ApiError');

// Helper: Generate unique certificate number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CERT${year}${random}`;
};

// Helper: Calculate certificate expiry (Max of existing expiry or today + 1 year)
const calculateExpiryDate = (previousExpiry = null) => {
  const now = new Date();

  if (previousExpiry) {
    const prevDate = new Date(previousExpiry);
    const effectiveDate = prevDate > now ? prevDate : now;
    effectiveDate.setFullYear(effectiveDate.getFullYear() + 1);
    return effectiveDate;
  }

  now.setFullYear(now.getFullYear() + 1);
  return now;
};

// 1. Create Payment Order
const createPaymentOrder = async (memberId) => {
  try {
    // Find member
    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Check if member is eligible for payment
    if (member.status !== 'verified' && member.status !== 'approved') {
      throw new ApiError(400, 'Your application is not yet approved. Please wait for admin approval.');
    }

    // Determine payment type (new or renewal)
    let paymentType;
    let amounts;

    if (!member.certificate.generated) {
      // NEW MEMBER - First payment
      if (member.payment.status === 'completed') {
        throw new ApiError(400, 'Payment already completed. Certificate is being processed.');
      }
      paymentType = 'new';
      amounts = calculateAmount('new');
    } else {
      // EXISTING MEMBER - Renewal
      const today = new Date();
      const expiryDate = new Date(member.certificate.expiryDate);
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      // Check if renewal is needed
      if (daysRemaining > 30) {
        throw new ApiError(400, `Certificate is still valid for ${daysRemaining} days. Renewal available 30 days before expiry.`);
      }

      paymentType = 'renewal';
      amounts = calculateAmount('renewal');
    }

    // Create Razorpay order
    // Note: Razorpay has a strict 40 character limit for 'receipt' strings.
    const receipt = `RCPT_${Date.now().toString().slice(-9)}_${Math.floor(Math.random() * 1000)}`;
    const notes = {
      memberId: member._id.toString(),
      memberEmail: member.email,
      memberName: member.member?.fullName || 'Member',
      paymentType,
    };

    const order = await createOrder(amounts.totalAmount, receipt, notes);

    // Track payment authentically in Payment table
    await Payment.create({
      user: member._id,
      razorpayOrderId: order.id,
      amount: amounts.totalAmount,
      currency: 'INR',
      status: 'pending',
      paymentType: paymentType,
      metadata: notes
    });

    // Store order details in member (legacy compat)
    member.payment.razorpayOrderId = order.id;
    member.payment.amount = amounts.totalAmount;
    member.payment.baseAmount = amounts.baseAmount;
    member.payment.gstAmount = amounts.gstAmount;
    member.payment.type = paymentType;
    await member.save();

    console.log(`✅ Payment order created for member: ${member.email} (${paymentType})`);

    return {
      orderId: order.id,
      amount: amounts.totalAmount,
      amountBreakdown: {
        base: amounts.baseAmount,
        gst: amounts.gstAmount,
        gstPercent: amounts.gstPercent,
        total: amounts.totalAmount,
      },
      currency: 'INR',
      keyId: getRazorpayKeyId(),
      memberDetails: {
        name: member.member?.fullName,
        email: member.email,
        contact: member.member?.mobile,
      },
      paymentType,
      notes: {
        membershipNumber: member.membershipNumber,
        establishmentName: member.establishment?.name,
      },
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// 2. Verify Payment
const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      console.error('❌ Invalid payment signature');
      throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // Find member by order ID
    const member = await User.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
    if (!member) {
      throw new ApiError(404, 'Order not found. Please contact support.');
    }

    // Duplicate Check: Database-level lookup to ensure we don't process it twice
    const existingPayment = await Payment.findOne({ razorpayOrderId: razorpayOrderId });
    if (!existingPayment) {
      throw new ApiError(404, 'Payment origin not internally recorded.');
    }

    if (existingPayment.status === 'completed' || member.payment.razorpayPaymentId === razorpayPaymentId) {
      console.log(`⚠️  Payment already processed for member: ${member.email}`);
      return {
        message: 'Payment already processed',
        alreadyProcessed: true,
        member: { id: member._id, email: member.email, status: member.status },
      };
    }

    const paymentType = member.payment.type;
    const paymentAmount = member.payment.amount;

    // Secure the Payment record
    existingPayment.status = 'completed';
    existingPayment.razorpayPaymentId = razorpayPaymentId;
    existingPayment.razorpaySignature = razorpaySignature;
    await existingPayment.save();

    // Update payment details
    member.payment.status = 'completed';
    member.payment.razorpayPaymentId = razorpayPaymentId;
    member.payment.razorpaySignature = razorpaySignature;
    member.payment.transactionId = razorpayPaymentId;
    member.payment.paymentDate = new Date();
    member.payment.paymentMethod = 'online';

    if (paymentType === 'new') {
      // NEW MEMBER - Generate certificate
      const expiryDate = calculateExpiryDate(null); // today + 1 year
      const issueDate = new Date();

      member.certificate.generated = true;
      member.certificate.certificateNumber = generateCertificateNumber();
      member.certificate.issueDate = issueDate;
      member.certificate.expiryDate = expiryDate;
      member.certificate.status = 'active';
      member.status = 'approved';

      await member.save();

      // Send payment success + certificate email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Successful!</h1>
            </div>
            <div class="content">
              <div class="success">
                <h2 style="margin: 0;">✅ Membership Activated</h2>
              </div>
              <p>Hi <strong>${member.member?.fullName || 'Member'}</strong>,</p>
              <p>Your payment has been successfully processed and your membership has been activated!</p>
              
              <div class="details">
                <h3>Payment Details:</h3>
                <p><strong>Amount Paid:</strong> ₹${paymentAmount}</p>
                <p><strong>Transaction ID:</strong> ${razorpayPaymentId}</p>
                <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div class="details">
                <h3>Certificate Details:</h3>
                <p><strong>Certificate Number:</strong> ${member.certificate.certificateNumber}</p>
                <p><strong>Issue Date:</strong> ${issueDate.toLocaleDateString()}</p>
                <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString()}</p>
              </div>

              <p>You can now access all member features and download your certificate from your profile.</p>
            </div>
            <div class="footer">
              <p>© 2024 TechFinit. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: member.email,
          subject: '🎉 Payment Successful - Membership Activated - TechFinit',
          html: emailContent,
        });
      } catch (emailError) {
        console.error('Non-critical error: Failed to send activation success email to', member.email, emailError);
      }

      console.log(`✅ Payment verified and certificate generated for NEW member: ${member.email}`);

      return {
        message: 'Payment successful! Your membership has been activated.',
        paymentType: 'new',
        paymentStatus: 'completed',
        amount: paymentAmount,
        transactionId: razorpayPaymentId,
        certificateGenerated: true,
        certificate: {
          certificateNumber: member.certificate.certificateNumber,
          issueDate,
          expiryDate,
          validFor: '1 year',
        },
        memberStatus: 'approved',
      };

    } else if (paymentType === 'renewal') {
      // RENEWAL - Extend certificate
      const previousExpiry = new Date(member.certificate.expiryDate);
      const newExpiry = calculateExpiryDate(previousExpiry);

      // Add to renewal history
      member.renewalHistory.push({
        renewalDate: new Date(),
        previousExpiryDate: previousExpiry,
        newExpiryDate: newExpiry,
        amount: paymentAmount,
        razorpayPaymentId,
        status: 'completed',
      });

      // Update certificate
      member.certificate.expiryDate = newExpiry;
      member.certificate.status = 'active';
      member.status = 'approved';

      await member.save();

      // Send renewal success email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #2196F3; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Certificate Renewed Successfully!</h1>
            </div>
            <div class="content">
              <div class="success">
                <h2 style="margin: 0;">✅ Membership Renewed</h2>
              </div>
              <p>Hi <strong>${member.member?.fullName || 'Member'}</strong>,</p>
              <p>Your membership renewal payment has been successfully processed!</p>
              
              <div class="details">
                <h3>Payment Details:</h3>
                <p><strong>Amount Paid:</strong> ₹${paymentAmount}</p>
                <p><strong>Transaction ID:</strong> ${razorpayPaymentId}</p>
                <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div class="details">
                <h3>Certificate Details:</h3>
                <p><strong>Certificate Number:</strong> ${member.certificate.certificateNumber}</p>
                <p><strong>Previous Expiry:</strong> ${previousExpiry.toLocaleDateString()}</p>
                <p><strong>New Expiry:</strong> ${newExpiry.toLocaleDateString()}</p>
                <p><strong>Extended By:</strong> 1 year</p>
              </div>

              <p>Your certificate has been extended for another year. You can download the updated certificate from your profile.</p>
            </div>
            <div class="footer">
              <p>© 2024 TechFinit. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: member.email,
          subject: '🔄 Certificate Renewed Successfully - TechFinit',
          html: emailContent,
        });
      } catch (emailError) {
        console.error('Non-critical error: Failed to send renewal success email to', member.email, emailError);
      }

      console.log(`✅ Payment verified and certificate renewed for member: ${member.email}`);

      return {
        message: 'Payment successful! Your certificate has been renewed.',
        paymentType: 'renewal',
        paymentStatus: 'completed',
        amount: paymentAmount,
        transactionId: razorpayPaymentId,
        certificateRenewed: true,
        certificate: {
          certificateNumber: member.certificate.certificateNumber,
          previousExpiry,
          newExpiry,
          extendedBy: '1 year',
        },
        memberStatus: 'approved',
      };
    }

    throw new ApiError(400, 'Invalid payment type');

  } catch (error) {
    console.error('Error verifying payment:', error);

    // If payment verification fails, mark payment as failed
    if (razorpayOrderId) {
      const member = await User.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
      if (member) {
        member.payment.status = 'failed';
        await member.save();
      }
    }

    throw error;
  }
};

// 3. Get Payment Status (for UI to show correct button)
const getPaymentStatus = async (memberId) => {
  try {
    const member = await User.findById(memberId).lean();

    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // NEW MEMBER - Not paid yet
    if (!member.certificate.generated) {
      const amounts = calculateAmount('new');

      return {
        memberType: 'new',
        paymentRequired: true,
        paymentType: 'registration',
        amount: amounts,
        certificateStatus: 'not_generated',
        buttonText: 'Pay Registration Fee',
        showButton: member.payment.status !== 'completed',
      };
    }

    // EXISTING MEMBER - Has certificate
    const today = new Date();
    const expiryDate = new Date(member.certificate.expiryDate);
    const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    // Active - More than 30 days remaining
    if (daysRemaining > 30) {
      return {
        memberType: 'existing',
        paymentRequired: false,
        certificateStatus: 'active',
        certificate: {
          certificateNumber: member.certificate.certificateNumber,
          issueDate: member.certificate.issueDate,
          expiryDate: member.certificate.expiryDate,
          daysRemaining,
        },
        buttonText: 'Download Certificate',
        showPaymentButton: false,
      };
    }

    // Expiring soon or expired - Show renewal option
    const amounts = calculateAmount('renewal');

    if (daysRemaining > 0) {
      // Expiring soon (1-30 days)
      return {
        memberType: 'existing',
        paymentRequired: false,
        renewalAvailable: true,
        paymentType: 'renewal',
        amount: amounts,
        certificateStatus: 'expiring_soon',
        certificate: {
          certificateNumber: member.certificate.certificateNumber,
          issueDate: member.certificate.issueDate,
          expiryDate: member.certificate.expiryDate,
          daysRemaining,
        },
        buttonText: 'Renew Now',
        showPaymentButton: true,
        alert: `Your certificate expires in ${daysRemaining} days`,
      };
    } else {
      // Expired
      return {
        memberType: 'existing',
        paymentRequired: true,
        paymentType: 'renewal',
        amount: amounts,
        certificateStatus: 'expired',
        certificate: {
          certificateNumber: member.certificate.certificateNumber,
          issueDate: member.certificate.issueDate,
          expiryDate: member.certificate.expiryDate,
          daysOverdue: Math.abs(daysRemaining),
        },
        buttonText: 'Renew Certificate',
        showPaymentButton: true,
        alert: `Your certificate expired ${Math.abs(daysRemaining)} days ago`,
      };
    }
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

// 4. Get Transactions (Ledger)
const getTransactions = async (memberId) => {
  try {
    const history = await Payment.find({ user: memberId }).sort({ createdAt: -1 }).lean();

    return history.map(h => ({
      id: h._id,
      transactionId: h.razorpayPaymentId || h.razorpayOrderId,
      amount: h.amount,
      status: h.status,
      date: h.createdAt,
      paymentMethod: 'Razorpay',
      description: h.paymentType === 'renewal' ? 'Annual Renewal' : 'New Registration',
      receipt: h.razorpayOrderId
    }));
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

// 5. Native Webhook Process
const processWebhook = async (reqBody, signature) => {
  if (!verifyWebhookSignature(reqBody, signature)) {
    throw new ApiError(400, 'Webhook Verification Failed!');
  }

  const event = reqBody.event;

  if (event === 'payment.captured' || event === 'payment.failed') {
    const paymentData = reqBody.payload.payment.entity;
    const orderId = paymentData.order_id;
    const paymentId = paymentData.id;

    if (event === 'payment.failed') {
      await Payment.updateOne({ razorpayOrderId: orderId }, { status: 'failed', razorpayPaymentId: paymentId });
      return { success: true, processed: true, status: 'failed' };
    }

    // The `payment.captured` logic triggers verification again independently to guarantee it gets processed even if the browser disconnected.
    // We do not have the user session, but we do have the order_id, payment_id and can manually trigger verified verification.

    const existingPayment = await Payment.findOne({ razorpayOrderId: orderId });
    if (existingPayment && existingPayment.status !== 'completed') {
      // We can safely construct artificial verified execution: 
      // Generating signature isn't strict here since we verified the webhook signature above. Let's just pass raw execution block directly if webhook is valid.
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const generatedSignature = require('crypto').createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
      await verifyPayment(orderId, paymentId, generatedSignature);
      return { success: true, processed: true, state: 'secured via webhook' };
    }
  }

  return { success: true, processed: false };
}


module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getTransactions,
  processWebhook
};
