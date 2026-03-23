const express = require('express');
const router = express.Router();
const { requestUpdate, getStatus, cancelRequest, downloadCertificate, uploadMissingDocument, directUpdate, downloadPublicCertificate } = require('../controllers/memberProfileController');
const { requestUpdateValidationRules, validate } = require('../validators/memberProfileValidator');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateMember } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public Certificate Download (No Auth Required)
router.get('/public-certificate/:memberId', asyncHandler(downloadPublicCertificate));

// All routes require authentication
router.use(authenticateMember);

// Request Profile Update
router.post(
  '/request-update',
  upload.fields([
    { name: 'agencyAddressProof', maxCount: 1 },
    { name: 'activityLicense', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 4 },
    { name: 'businessCard', maxCount: 1 },
    { name: 'agencyLogo', maxCount: 1 },
    { name: 'memberPhoto', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 1 },
  ]),
  (req, res, next) => {
    if (typeof req.body.requestedChanges === 'string') {
      try {
        req.body.requestedChanges = JSON.parse(req.body.requestedChanges);
      } catch (err) {
        // Validation will handle bad JSON if it wasn't parsed properly
      }
    }
    next();
  },
  requestUpdateValidationRules,
  validate,
  asyncHandler(requestUpdate)
);

// Direct Profile Update
router.patch(
  '/direct-update',
  upload.fields([
    { name: 'agencyAddressProof', maxCount: 1 },
    { name: 'activityLicense', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 4 },
    { name: 'businessCard', maxCount: 1 },
    { name: 'agencyLogo', maxCount: 1 },
    { name: 'memberPhoto', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 1 },
  ]),
  (req, res, next) => {
    if (typeof req.body.requestedChanges === 'string') {
      try {
        req.body.requestedChanges = JSON.parse(req.body.requestedChanges);
      } catch (err) {
        // Validation will handle bad JSON if it wasn't parsed properly
      }
    }
    next();
  },
  requestUpdateValidationRules,
  validate,
  asyncHandler(directUpdate)
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
  asyncHandler(downloadCertificate)
);

// Upload Missing Document
router.post(
  '/documents/upload',
  upload.single('document'),
  asyncHandler(uploadMissingDocument)
);

module.exports = router;
