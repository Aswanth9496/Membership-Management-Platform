const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { createOrder, verifyPaymentSignature, getRazorpayKeyId } = require('../utils/razorpayHelper');
const { sendEmail } = require('../utils/emailService');
// Lazy import to avoid potential circular dependencies if they arise
let memberEventService;
const getMemberEventService = () => {
    if (!memberEventService) {
        memberEventService = require('./memberEventService');
    }
    return memberEventService;
};

// Helper: Generate unique certificate number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CERT${year}${random}`;
};

// Helper: Generate unique Order number
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${year}-${ts}${rand}`;
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
    console.log("Creating order with amounts:", amounts);
    const order = await createOrder(amounts.totalAmount, receipt, notes);

    console.log("Order created:", order);

    // Track payment authentically in Payment table (Legacy)
    await Payment.create({
      user: member._id,
      razorpayOrderId: order.id,
      amount: amounts.totalAmount,
      currency: 'INR',
      status: 'pending',
      paymentType: paymentType,
      metadata: notes
    });

    // Track payment in the new PRODUCTION-STANDARD Order model
    const newOrder = await Order.create({
      orderNumber: generateOrderNumber(),
      member: member._id,
      razorpayOrderId: order.id,
      amount: {
        total: amounts.totalAmount,
        base: amounts.baseAmount,
        gst: amounts.gstAmount,
        currency: 'INR'
      },
      status: 'created',
      orderType: paymentType === 'new' ? 'membership_new' : 'membership_renewal',
      metadata: {
        paymentType,
        email: member.email
      },
      history: [{
        status: 'created',
        description: `Order initiated for ${paymentType} membership`
      }]
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
// 2. Verify Payment (UNIFIED GATEWAY - Production Standard)
const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    // 1. Verify cryptographic signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      console.error('❌ Invalid payment signature');
      throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // 2. Identify the Order (The Central Truth)
    const internalOrder = await Order.findOne({ razorpayOrderId });
    if (!internalOrder) {
      throw new ApiError(404, 'Transaction record not found in system.');
    }

    // 3. Short-circuit if already processed
    if (internalOrder.status === 'paid') {
        console.log(`⚠️  Order ${internalOrder.orderNumber} already marked as paid.`);
        return { success: true, alreadyProcessed: true, orderType: internalOrder.orderType };
    }

    // 4. Common Status Updates (Order & Payment)
    internalOrder.status = 'paid';
    internalOrder.razorpayPaymentId = razorpayPaymentId;
    internalOrder.razorpaySignature = razorpaySignature;
    internalOrder.paymentDetails.captured = true;
    internalOrder.paymentDetails.method = 'Razorpay Unified';
    internalOrder.history.push({
        status: 'paid',
        description: `Payment verified via unified gateway. Type: ${internalOrder.orderType}`
    });
    await internalOrder.save();

    await Payment.updateOne(
        { razorpayOrderId },
        { status: 'completed', razorpayPaymentId, razorpaySignature }
    );

    // 5. Branch Logic based on Order Type
    const orderType = internalOrder.orderType;

    if (orderType === 'membership_new' || orderType === 'membership_renewal') {
        return await handleMembershipVerification(internalOrder, razorpayPaymentId, razorpaySignature);
    } else if (orderType === 'event_booking') {
        const eventService = getMemberEventService();
        return await eventService.verifyRegistrationPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    }

    throw new ApiError(400, `Unsupported order type: ${orderType}`);
  } catch (error) {
    console.error('Error in unified verification:', error);
    if (razorpayOrderId) {
        await Order.updateOne({ razorpayOrderId }, { status: 'failed' }).catch(() => {});
        await Payment.updateOne({ razorpayOrderId }, { status: 'failed' }).catch(() => {});
    }
    throw error;
  }
};

// Internal Helper: Handle Membership specific logic
const handleMembershipVerification = async (order, paymentId, signature) => {
    const member = await User.findById(order.member);
    if (!member) throw new ApiError(404, 'Member not found');

    const paymentType = member.payment.type;
    const paymentAmount = order.amount.total;

    // Update member individual payment block (Sync for profiles)
    member.payment.status = 'completed';
    member.payment.razorpayPaymentId = paymentId;
    member.payment.razorpaySignature = signature;
    member.payment.paymentDate = new Date();

    if (paymentType === 'new') {
      const expiryDate = calculateExpiryDate(null);
      const issueDate = new Date();

      member.certificate.generated = true;
      member.certificate.certificateNumber = generateCertificateNumber();
      member.certificate.issueDate = issueDate;
      member.certificate.expiryDate = expiryDate;
      member.certificate.status = 'active';
      member.status = 'approved';

      await member.save();
      await sendMembershipEmail(member, 'new', paymentAmount, paymentId, issueDate, expiryDate);
      
      return {
        success: true,
        message: 'Membership activated successfully!',
        orderType: 'membership_new',
        certificate: { number: member.certificate.certificateNumber, expiry: expiryDate }
      };
    } else {
      const previousExpiry = new Date(member.certificate.expiryDate);
      const newExpiry = calculateExpiryDate(previousExpiry);

      member.renewalHistory.push({
        renewalDate: new Date(),
        previousExpiryDate: previousExpiry,
        newExpiryDate: newExpiry,
        amount: paymentAmount,
        razorpayPaymentId: paymentId,
        status: 'completed',
      });

      member.certificate.expiryDate = newExpiry;
      member.certificate.status = 'active';
      member.status = 'approved';

      await member.save();
      await sendMembershipEmail(member, 'renewal', paymentAmount, paymentId, null, newExpiry, previousExpiry);

      return {
        success: true,
        message: 'Membership renewed successfully!',
        orderType: 'membership_renewal',
        expiry: newExpiry
      };
    }
};

// Helper to keep verifyPayment clean
const sendMembershipEmail = async (member, type, amount, paymentId, issueDate, expiryDate, prevExpiry) => {
    const isNew = type === 'new';
    const emailContent = isNew ? `
        <h1>🎉 Membership Activated!</h1>
        <p>Hi ${member.member?.fullName}, your membership is now active.</p>
        <p><strong>Certificate:</strong> ${member.certificate.certificateNumber}</p>
        <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString()}</p>
    ` : `
        <h1>🔄 Membership Renewed!</h1>
        <p>Hi ${member.member?.fullName}, your membership has been extended.</p>
        <p><strong>New Expiry:</strong> ${expiryDate.toLocaleDateString()}</p>
    `;

    try {
        await sendEmail({
            to: member.email,
            subject: isNew ? '🎉 Membership Activated - TechFinit' : '🔄 Membership Renewed - TechFinit',
            html: emailContent
        });
    } catch (e) {
        console.error('Non-critical: Email failed', e);
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

// 4. Get Transactions (Ledger - Unified)
const getTransactions = async (memberId = null, isAdmin = false) => {
  try {
    // Only return completed or failed transactions (ignore pending)
    let query = { status: { $in: ['completed', 'failed'] } };
    
    if (!isAdmin && memberId) {
      query.user = memberId;
    }

    let historyQuery = Payment.find(query).sort({ createdAt: -1 });

    // If admin, populate the user details so the UI knows who made the payment
    if (isAdmin) {
      historyQuery = historyQuery.populate('user', 'member.fullName email establishment.name');
    }

    const history = await historyQuery.lean();

    return history.map(h => ({
      id: h._id,
      transactionId: h.razorpayPaymentId || h.razorpayOrderId,
      amount: h.amount,
      status: h.status,
      date: h.createdAt,
      paymentMethod: h.paymentDetails?.method || 'Razorpay',
      description: h.paymentType === 'new' ? 'New Registration' : (h.paymentType === 'renewal' ? 'Annual Renewal' : 'Event Registration'),
      receipt: h.razorpayOrderId,
      // Pass along member data if an admin requested it
      memberInfo: isAdmin && h.user ? {
        name: h.user.member?.fullName || 'Unknown',
        email: h.user.email,
        establishment: h.user.establishment?.name || 'Unknown'
      } : null
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
      // Update Order model for auditing (Production Standard)
      await Order.updateOne(
        { razorpayOrderId: orderId },
        {
          status: 'failed',
          razorpayPaymentId: paymentId,
          'paymentDetails.captured': false,
          'paymentDetails.error_description': paymentData.error_description || 'Payment failed'
        }
      ).catch(err => console.error("Non-critical: Order update failed in webhook", err));

      return { success: true, processed: true, status: 'failed' };
    }

    // Webhook acts as a fail-safe. If frontend verification fails or browser closes,
    // this block ensures the order is processed.

    const existingPayment = await Payment.findOne({ razorpayOrderId: orderId });
    const existingOrder = await Order.findOne({ razorpayOrderId: orderId });

    // If either record is not yet marked as success, process it now (Production Standard)
    if ((existingPayment && existingPayment.status !== 'completed') || (existingOrder && existingOrder.status !== 'paid')) {
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


// 6. Dummy Success Payment (Bypass for testing)
const processDummyPayment = async (memberId) => {
  try {
    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    // Update status and payment details
    member.status = 'approved';
    member.payment.status = 'completed';
    member.payment.type = 'renewal'; // As requested by user
    member.payment.paymentDate = issueDate;
    member.payment.paymentMethod = 'dummy_bypass';

    // Generate certificate
    member.certificate.generated = true;
    member.certificate.certificateNumber = `DUMMY-${Date.now()}`;
    member.certificate.issueDate = issueDate;
    member.certificate.expiryDate = expiryDate;
    member.certificate.status = 'active';

    await member.save();

    console.log(`✅ Dummy payment bypass triggered for member: ${member.email}`);

    return {
      message: 'Payment completed successfully (Dummy Bypass)',
      memberStatus: member.status,
      certificate: member.certificate
    };
  } catch (error) {
    console.error('Error processing dummy payment:', error);
    throw error;
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getTransactions,
  processWebhook,
  processDummyPayment
};
