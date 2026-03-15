const ReferenceRequest = require('../models/ReferenceRequest');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/emailService');
const { referenceRequestTemplate } = require('../utils/emailTemplates');

/**
 * Create reference requests for a new applicant
 * @param {string} applicantId 
 * @param {string[]} referenceIds 
 */
const createReferenceRequests = async (applicantId, referenceIds) => {
  if (!referenceIds || referenceIds.length === 0) return;

  const applicant = await User.findById(applicantId);
  if (!applicant) throw new ApiError(404, 'Applicant not found');

  const agencyName = applicant.establishment?.name || 'their agency';
  const applicantName = applicant.member?.fullName || 'An applicant';

  for (const refId of referenceIds) {
    try {
      const referencedMember = await User.findById(refId);
      if (!referencedMember) continue;

      // Prevent self-referencing
      if (applicantId.toString() === refId.toString()) {
        console.warn(`Self-referencing detected for applicant ${applicantId}. Skipping.`);
        continue;
      }

      // Check if request already exists (due to unique index, but good to handle)
      const existing = await ReferenceRequest.findOne({ applicantId, referencedMemberId: refId });
      if (existing) continue;

      console.log(`Creating ReferenceRequest for applicant ${applicantId} -> ref ${refId}`);
      await ReferenceRequest.create({
        applicantId,
        referencedMemberId: refId,
        status: 'pending'
      });

      // Send Email
      const emailHtml = referenceRequestTemplate(
        referencedMember.member?.fullName || 'Member',
        applicantName,
        agencyName
      );

      await sendEmail({
        to: referencedMember.email,
        subject: '📝 Reference Request Confirmation - techfinit',
        html: emailHtml,
      });
      console.log(`Successfully sent reference request email to ${referencedMember.email}`);
    } catch (error) {
      console.error(`ERROR in createReferenceRequests for ref ${refId}:`, error);
    }
  }
};

/**
 * Get all reference requests for a specific member (pending and history)
 * @param {string} memberId 
 */
const getAllRequestsForMember = async (memberId) => {
  return await ReferenceRequest.find({
    referencedMemberId: memberId
  })
  .populate('applicantId', 'member.fullName establishment.name email createdAt')
  .sort({ createdAt: -1 });
};

/**
 * Get pending reference requests for a specific member
 * @param {string} memberId 
 */
const getPendingRequestsForMember = async (memberId) => {
  return await ReferenceRequest.find({
    referencedMemberId: memberId,
    status: 'pending'
  })
  .populate('applicantId', 'member.fullName establishment.name email createdAt')
  .sort({ createdAt: -1 });
};

/**
 * Update the status of a reference request
 * @param {string} requestId 
 * @param {string} memberId 
 * @param {string} status 'confirmed' or 'rejected'
 */
const updateRequestStatus = async (requestId, memberId, status) => {
  if (!['confirmed', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const request = await ReferenceRequest.findOne({
    _id: requestId,
    referencedMemberId: memberId
  });

  if (!request) {
    throw new ApiError(404, 'Reference request not found or unauthorized');
  }

  request.status = status;
  request.verifiedAt = new Date();
  await request.save();

  return request;
};

/**
 * Get all reference requests submitted by a specific applicant
 * @param {string} applicantId 
 */
const getRequestsByApplicant = async (applicantId) => {
  return await ReferenceRequest.find({
    applicantId
  })
  .populate('referencedMemberId', 'member.fullName establishment.name membershipNumber email')
  .sort({ createdAt: -1 });
};

/**
 * Get all reference requests for Admin Panel
 */
const getAllRequestsForAdmin = async () => {
  return await ReferenceRequest.find()
    .populate('applicantId', 'member.fullName establishment.name')
    .populate('referencedMemberId', 'member.fullName membershipNumber')
    .sort({ createdAt: -1 });
};

module.exports = {
  createReferenceRequests,
  getAllRequestsForMember,
  getPendingRequestsForMember,
  updateRequestStatus,
  getRequestsByApplicant,
  getAllRequestsForAdmin
};
