const express = require('express');
const router = express.Router();
const { requestUpdate, getStatus, cancelRequest, downloadCertificate } = require('../controllers/memberProfileController');
const { requestUpdateValidationRules, validate } = require('../validators/memberProfileValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateMember } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateMember);

// Request Profile Update
router.post(
  '/request-update',
  requestUpdateValidationRules,
  validate,
  asyncHandler(requestUpdate)
);

// Get Change Request Status
router.get(
  '/change-status',
  asyncHandler(getStatus)
);

// Cancel Pending Request
router.delete(
  '/cancel-request',
  asyncHandler(cancelRequest)
);

// Download Certificate
router.get(
  '/certificate/download',
  downloadCertificate
);

module.exports = router;
