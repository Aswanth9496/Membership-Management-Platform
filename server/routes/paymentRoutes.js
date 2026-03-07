const express = require('express');
const router = express.Router();
const { getStatus, createOrder, verify, getTransactionsList, handleWebhook } = require('../controllers/paymentController');
const { verifyPaymentValidationRules, validate } = require('../validators/paymentValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateMember } = require('../middlewares/authMiddleware');

// Get Payment Status (Protected - Member must be logged in)
router.get('/status', authenticateMember, asyncHandler(getStatus));

// Create Payment Order (Protected - Member must be logged in)
router.post('/create-order', authenticateMember, asyncHandler(createOrder));

// Verify Payment (Public - Called by Razorpay webhook OR frontend callback)
router.post('/verify', verifyPaymentValidationRules, validate, asyncHandler(verify));

// Get Transactions (Protected)
router.get('/transactions', authenticateMember, asyncHandler(getTransactionsList));

// Razorpay Webhook (Publicly exposed secure hook from Razorpay servers)
router.post('/webhook', asyncHandler(handleWebhook));

module.exports = router;
