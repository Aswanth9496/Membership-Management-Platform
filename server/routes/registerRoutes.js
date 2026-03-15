const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, getApprovedMembers } = require('../controllers/registerController');
const { sendOTP, verifyOTP } = require('../controllers/verificationController');
const { registerValidationRules, validate } = require('../validators/registerValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../middlewares/uploadMiddleware');
const parseNestedBody = require('../middlewares/parseNestedBody');

// Email Verification for Registration
router.post('/send-otp', asyncHandler(sendOTP));
router.post('/verify-otp', asyncHandler(verifyOTP));

router.get('/members', asyncHandler(getApprovedMembers));

router.post(
  '/',
  upload.fields([
    { name: 'agencyAddressProof', maxCount: 1 },
    { name: 'activityLicense', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 },
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
