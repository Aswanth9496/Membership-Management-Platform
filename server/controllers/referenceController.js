const referenceService = require('../services/referenceService');
const { successResponse } = require('../utils/responseHelper');

/**
 * Get all reference requests for the logged-in member (including history)
 */
const getAllMyReferences = async (req, res) => {
  const requests = await referenceService.getAllRequestsForMember(req.member.id);
  successResponse(res, { requests }, 'All references retrieved successfully');
};

/**
 * Get pending reference requests for the logged-in member
 */
const getMyReferenceRequests = async (req, res) => {
  const requests = await referenceService.getPendingRequestsForMember(req.member.id);
  successResponse(res, { requests }, 'Reference requests retrieved successfully');
};

/**
 * Confirm a reference request
 */
const confirmReference = async (req, res) => {
  const { requestId } = req.params;
  const { remarks } = req.body;
  const request = await referenceService.updateRequestStatus(requestId, req.member.id, 'confirmed');
  // We can also update remarks if needed, but the service only updates status for now
  if (remarks) {
    request.remarks = remarks;
    await request.save();
  }
  successResponse(res, { request }, 'Reference confirmed successfully');
};

/**
 * Reject a reference request
 */
const rejectReference = async (req, res) => {
  const { requestId } = req.params;
  const { remarks } = req.body;
  const request = await referenceService.updateRequestStatus(requestId, req.member.id, 'rejected');
  if (remarks) {
    request.remarks = remarks;
    await request.save();
  }
  successResponse(res, { request }, 'Reference rejected successfully');
};

/**
 * Get reference requests submitted by the logged-in user
 */
const getMyApplicantRequests = async (req, res) => {
  const requests = await referenceService.getRequestsByApplicant(req.member.id);
  successResponse(res, { requests }, 'Your submitted reference requests retrieved successfully');
};

/**
 * Get all reference requests for Admin Panel
 */
const getAllAdminReferenceRequests = async (req, res) => {
  const requests = await referenceService.getAllRequestsForAdmin();
  successResponse(res, { requests }, 'All reference requests retrieved successfully');
};

/**
 * Reapply a rejected reference request
 */
const reapplyReference = async (req, res) => {
  const { requestId } = req.params;
  const request = await referenceService.reapplyRequest(requestId, req.member.id);
  successResponse(res, { request }, 'Reference request submitted again successfully');
};

module.exports = {
  getAllMyReferences,
  getMyReferenceRequests,
  getMyApplicantRequests,
  confirmReference,
  rejectReference,
  getAllAdminReferenceRequests,
  reapplyReference
};
