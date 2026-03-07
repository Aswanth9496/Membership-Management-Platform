const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance ONLY when first called to ensure process.env is injected by server.js first
let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Payment configuration
const PAYMENT_CONFIG = {
  NEW_MEMBER: {
    baseAmount: parseInt(process.env.NEW_MEMBER_BASE_AMOUNT) || 3000,
    gstPercent: parseInt(process.env.NEW_MEMBER_GST_PERCENT) || 18,
  },
  RENEWAL: {
    baseAmount: parseInt(process.env.RENEWAL_BASE_AMOUNT) || 2000,
    gstPercent: parseInt(process.env.RENEWAL_GST_PERCENT) || 18,
  },
};

// Calculate payment amounts
const calculateAmount = (type) => {
  const config = type === 'renewal' ? PAYMENT_CONFIG.RENEWAL : PAYMENT_CONFIG.NEW_MEMBER;
  const baseAmount = config.baseAmount;
  const gstAmount = Math.round((baseAmount * config.gstPercent) / 100);
  const totalAmount = baseAmount + gstAmount;

  return {
    baseAmount,
    gstAmount,
    totalAmount,
    gstPercent: config.gstPercent,
  };
};

// Create Razorpay order
const createOrder = async (amount, receipt, notes = {}) => {
  try {
    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: amount * 100, // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: receipt,
      notes: notes,
    });

    return order;
  } catch (error) {
    let rzpError = 'Failed to create payment order.';
    if (error && error.error && error.error.description) {
      rzpError = error.error.description;
    } else if (error && error.message) {
      rzpError = error.message;
    }
    console.error('❌ Razorpay order creation failed:', rzpError, error);
    throw new Error(rzpError);
  }
};

// Verify Razorpay payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Create expected signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Compare signatures
    return generatedSignature === signature;
  } catch (error) {
    console.error('❌ Payment signature verification failed:', error);
    return false;
  }
};

// Verify webhook signature
const verifyWebhookSignature = (webhookBody, webhookSignature) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(webhookBody))
      .digest('hex');

    return expectedSignature === webhookSignature;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return false;
  }
};

// Get Razorpay key ID (for frontend)
const getRazorpayKeyId = () => {
  return process.env.RAZORPAY_KEY_ID;
};

module.exports = {
  getRazorpayInstance,
  PAYMENT_CONFIG,
  calculateAmount,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayKeyId,
};
