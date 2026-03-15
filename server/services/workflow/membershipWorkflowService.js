const MembershipApplication = require('../../models/v2/MembershipApplication');
const ApprovalWorkflow = require('../../models/v2/ApprovalWorkflow');
const Referral = require('../../models/v2/Referral');
const ApiError = require('../../utils/ApiError');

/**
 * Transitions:
 * submitted -> pending_referral (if references > 0)
 * submitted -> ready_for_approval (if references == 0)
 * pending_referral -> ready_for_approval (all referrals confirmed)
 * pending_referral -> referral_rejected (any referral rejected)
 * ready_for_approval -> approved (all admin roles confirmed)
 * ready_for_approval -> rejected (any admin rejects)
 * approved -> payment_pending
 * payment_pending -> completed (payment verified)
 */

const transitionTo = async (applicationId, nextStatus, context = {}) => {
  const application = await MembershipApplication.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  const currentStatus = application.status;

  // Validation of transitions can be added here
  
  application.status = nextStatus;
  
  if (context.rejectionReason) {
    application.rejectionReason = context.rejectionReason;
  }

  await application.save();

  // Log Audit trail (Mock for now)
  console.log(`[AUDIT] Application ${applicationId} transitioned from ${currentStatus} to ${nextStatus} by ${context.actorId || 'System'}`);

  return application;
};

const handleAdminApproval = async (applicationId, adminId, role, decision, remarks) => {
  let workflow = await ApprovalWorkflow.findOne({ applicationId });
  
  if (!workflow) {
    workflow = new ApprovalWorkflow({
      applicationId,
      approvals: [
        { role: 'president', status: 'pending' },
        { role: 'secretary', status: 'pending' },
        { role: 'treasurer', status: 'pending' }
      ]
    });
  }

  const approvalIdx = workflow.approvals.findIndex(a => a.role === role);
  if (approvalIdx === -1) throw new ApiError(400, 'Invalid role for approval');

  workflow.approvals[approvalIdx] = {
    role,
    status: decision,
    adminId,
    updatedAt: new Date(),
    remarks
  };

  // Check if all approved or any rejected
  const allApproved = workflow.approvals.every(a => a.status === 'approved');
  const anyRejected = workflow.approvals.some(a => a.status === 'rejected');

  if (anyRejected) {
    workflow.finalStatus = 'rejected';
    await transitionTo(applicationId, 'rejected', { actorId: adminId, rejectionReason: remarks });
  } else if (allApproved) {
    workflow.finalStatus = 'approved';
    await transitionTo(applicationId, 'approved', { actorId: adminId });
  }

  await workflow.save();
  return workflow;
};

module.exports = {
  transitionTo,
  handleAdminApproval
};
