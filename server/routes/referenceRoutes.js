const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');
const { authenticateMember, authenticateAdmin, authorizeRoles } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

// Member routes (Protected)
router.get('/all', authenticateMember, asyncHandler(referenceController.getAllMyReferences));
router.get('/my-requests', authenticateMember, asyncHandler(referenceController.getMyReferenceRequests));
router.get('/my-submissions', authenticateMember, asyncHandler(referenceController.getMyApplicantRequests));
router.patch('/:requestId/confirm', authenticateMember, asyncHandler(referenceController.confirmReference));
router.patch('/:requestId/reject', authenticateMember, asyncHandler(referenceController.rejectReference));
router.patch('/:requestId/reapply', authenticateMember, asyncHandler(referenceController.reapplyReference));

// Admin routes (Protected & Authorized)
router.get('/admin/all', authenticateAdmin, authorizeRoles('admin', 'superadmin'), asyncHandler(referenceController.getAllAdminReferenceRequests));

module.exports = router;
