const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, uploadDocument } = require('../controllers/registerController');
const { registerValidationRules, validate } = require('../validators/registerValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../middlewares/uploadMiddleware');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts from this IP. Please try again after 15 minutes.',
});

router.post(
  '/',
  registerLimiter,
  registerValidationRules,
  validate,
  asyncHandler(register)
);

// Upload document route (during registration)
router.post(
  '/documents/upload',
  upload.single('document'),
  asyncHandler(uploadDocument)
);

module.exports = router;
