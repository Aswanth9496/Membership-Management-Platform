const referenceService = require('../services/referenceService');
const { successResponse } = require('../utils/responseHelper');

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
 * Get all reference requests for Admin Panel
 */
const getAllAdminReferenceRequests = async (req, res) => {
  const requests = await referenceService.getAllRequestsForAdmin();
  successResponse(res, { requests }, 'All reference requests retrieved successfully');
};

module.exports = {
  getMyReferenceRequests,
  confirmReference,
  rejectReference,
  getAllAdminReferenceRequests
};
