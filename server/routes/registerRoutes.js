const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, getApprovedMembers } = require('../controllers/registerController');
const { sendOTP, verifyOTP } = require('../controllers/verificationController');
const { registerValidationRules, validate } = require('../validators/registerValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../middlewares/uploadMiddleware');
const parseNestedBody = require('../middlewares/parseNestedBody');

// Lightweight rate limiters for registration OTP endpoints
const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Too many OTP requests from this IP, please try again shortly.'
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many verification attempts from this IP, please try again later.'
});

// Email Verification for Registration
router.post('/send-otp', sendOtpLimiter, asyncHandler(sendOTP));
router.post('/verify-otp', verifyOtpLimiter, asyncHandler(verifyOTP));

router.get('/members', asyncHandler(getApprovedMembers));

router.post(
  '/',
  upload.fields([
    { name: 'agencyAddressProof', maxCount: 1 },
    { name: 'activityLicense', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 4 }, // allow up to 4 shop photos
    { name: 'businessCard', maxCount: 1 },
    { name: 'agencyLogo', maxCount: 1 },
    { name: 'memberPhoto', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 1 }
  ]),
  parseNestedBody,
  registerValidationRules,
  validate,
  asyncHandler(register)
);

module.exports = router;
