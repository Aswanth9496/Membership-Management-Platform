const express = require('express');
const router = express.Router();
const { requestUpdate, getStatus, cancelRequest, downloadCertificate, uploadMissingDocument } = require('../controllers/memberProfileController');
const { requestUpdateValidationRules, validate } = require('../validators/memberProfileValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateMember } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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

// Upload Missing Document
router.post(
  '/documents/upload',
  upload.single('document'),
  asyncHandler(uploadMissingDocument)
);

module.exports = router;
