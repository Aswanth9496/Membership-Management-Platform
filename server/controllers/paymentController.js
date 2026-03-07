const { createPaymentOrder, verifyPayment, getPaymentStatus, getTransactions, processWebhook } = require('../services/paymentService');
const { successResponse } = require('../utils/responseHelper');

// Get Payment Status
const getStatus = async (req, res) => {
  const memberId = req.member._id;

  const result = await getPaymentStatus(memberId);

  successResponse(res, result, 'Payment status retrieved successfully');
};

// Create Payment Order
const createOrder = async (req, res) => {
  const memberId = req.member._id;

  const result = await createPaymentOrder(memberId);

  successResponse(res, result, 'Payment order created successfully');
};

// Verify Payment (Razorpay Callback)
const verify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const result = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  successResponse(res, result, result.message || 'Payment verified successfully');
};

// Fetch user's payment transaction history ledger
const getTransactionsList = async (req, res) => {
  const memberId = req.member._id;
  const result = await getTransactions(memberId);
  successResponse(res, result, 'Transactions retrieved successfully');
};

// Handle Razorpay secure server webhook
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await processWebhook(req.body, signature);
  res.status(200).json(result); // Webhooks typically just respond 200 OK cleanly
};

module.exports = {
  getStatus,
  createOrder,
  verify,
  getTransactionsList,
  handleWebhook
};
