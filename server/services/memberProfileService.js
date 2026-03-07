const User = require('../models/User');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');
const { sendEmail } = require('../utils/emailService');
const ApiError = require('../utils/ApiError');

// Helper: Get changed fields comparison
const getChangedFields = (current, requested) => {
  const changes = [];
  const flattenObject = (obj, prefix = '') => {
    const result = {};
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(result, flattenObject(obj[key], `${prefix}${key}.`));
      } else {
        result[`${prefix}${key}`] = obj[key];
      }
    }
    return result;
  };

  const flatCurrent = flattenObject(current);
  const flatRequested = flattenObject(requested);

  for (const key in flatRequested) {
    if (JSON.stringify(flatCurrent[key]) !== JSON.stringify(flatRequested[key])) {
      changes.push({
        field: key,
        currentValue: flatCurrent[key],
        requestedValue: flatRequested[key],
      });
    }
  }

  return changes;
};

// 1. Request Profile Update
const requestProfileUpdate = async (memberId, requestedChanges) => {
  try {
    const member = await User.findById(memberId);
    if (!member) throw new ApiError(404, 'Member not found');

    const existingRequest = await ProfileUpdateRequest.findOne({ userId: memberId, status: 'pending' });
    if (existingRequest) {
      const pendingFor = Math.floor((new Date() - existingRequest.requestedAt) / (1000 * 60 * 60));
      throw new ApiError(400, `You already have a pending profile update request. Please wait for admin review. (Pending for ${pendingFor} hours)`);
    }

    if (!requestedChanges || Object.keys(requestedChanges).length === 0) {
      throw new ApiError(400, 'No changes provided.');
    }

    const currentProfile = {
      member: member.member,
      location: member.location,
      establishment: member.establishment,
      partner: member.partner,
      staff: member.staff,
    };

    const changedFields = getChangedFields(currentProfile, requestedChanges);
    if (changedFields.length === 0) {
      throw new ApiError(400, 'No actual changes detected.');
    }

    const newRequest = new ProfileUpdateRequest({
      userId: memberId,
      currentData: currentProfile,
      requestedData: requestedChanges,
      status: 'pending'
    });

    await newRequest.save();

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .changes { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Profile Update Request Submitted</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${member.member?.fullName || 'Member'}</strong>,</p>
            <p>Your profile update request has been submitted successfully and is now pending admin review.</p>
            <div class="changes">
              <p><strong>${changedFields.length}</strong> field(s) pending update.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: member.email,
        subject: 'Profile Update Request Submitted - TechFinit',
        html: emailContent,
      });
    } catch (emailError) {
      console.warn('Could not send confirmation email, but request was created.', emailError.message);
    }

    return {
      message: 'Profile update request submitted successfully.',
      requestId: newRequest._id,
      status: 'pending',
      totalChanges: changedFields.length,
      estimatedReviewTime: '24-48 hours',
    };
  } catch (error) {
    throw error;
  }
};

// 2. Get Profile Change Request Status
const getChangeRequestStatus = async (memberId) => {
  try {
    const request = await ProfileUpdateRequest.findOne({ userId: memberId }).sort({ requestedAt: -1 }).lean();

    if (!request) {
      return { hasPendingRequest: false, lastRequest: null, message: 'No recent requests' };
    }

    if (request.status === 'pending') {
      const pendingFor = Math.floor((new Date() - new Date(request.requestedAt)) / (1000 * 60));
      return {
        hasPendingRequest: true,
        message: 'You have a pending profile update request',
        request: {
          status: 'pending',
          requestedAt: request.requestedAt,
          pendingFor: `${Math.floor(pendingFor / 60)} hours ${pendingFor % 60} minutes`,
        },
      };
    }

    return {
      hasPendingRequest: false,
      message: `Your last request was ${request.status}`,
      lastRequest: {
        status: request.status,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt,
        rejectionReason: request.rejectionReason,
      },
    };
  } catch (error) {
    throw error;
  }
};

// 3. Cancel Pending Request
const cancelChangeRequest = async (memberId) => {
  try {
    const request = await ProfileUpdateRequest.findOne({ userId: memberId, status: 'pending' });
    if (!request) throw new ApiError(400, 'No pending request found');

    await ProfileUpdateRequest.findByIdAndDelete(request._id);

    return {
      message: 'Request cancelled successfully',
      cancelledAt: new Date(),
    };
  } catch (error) {
    throw error;
  }
};

// 4. Get all Profile Update Requests (Admin)
const getAllProfileUpdateRequests = async () => {
  try {
    const requests = await ProfileUpdateRequest.find({})
      .populate('userId', 'email member.fullName member.mobile establishment.name')
      .sort({ requestedAt: -1 })
      .lean();

    return requests.map(r => ({
      id: r._id,
      userId: r.userId?._id,
      userName: r.userId?.member?.fullName || 'N/A',
      email: r.userId?.email || 'N/A',
      phone: r.userId?.member?.mobile || 'N/A',
      establishment: r.userId?.establishment?.name || 'N/A',
      currentData: r.currentData,
      requestedData: r.requestedData,
      status: r.status,
      requestedAt: r.requestedAt,
      reviewedAt: r.reviewedAt,
      rejectionReason: r.rejectionReason
    }));
  } catch (error) {
    throw error;
  }
};

// 5. Review Profile Update (Admin)
const reviewProfileUpdate = async (requestId, action, adminRole, adminName, rejectionReason) => {
  try {
    const request = await ProfileUpdateRequest.findById(requestId);
    if (!request) throw new ApiError(404, 'Request not found');
    if (request.status !== 'pending') throw new ApiError(400, 'Request is already processed');

    const member = await User.findById(request.userId);
    if (!member) throw new ApiError(404, 'Member not found');

    if (action === 'approve') {
      request.status = 'approved';

      // Merge requested data deeply into member profile
      const flattenAndApply = (source, target) => {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            flattenAndApply(source[key], target[key]);
          } else {
            target[key] = source[key];
          }
        }
      };

      // Assuming requestedData matches root structure (member, location, establishment, etc)
      flattenAndApply(request.requestedData, member);
      await member.save();
    } else {
      request.status = 'rejected';
      request.rejectionReason = rejectionReason;
    }

    request.reviewedAt = new Date();
    // Assuming we do not have admin ID currently passed properly, skipping ref assignment or just leaving it empty unless needed.

    await request.save();

    // Notify user
    try {
      await sendEmail({
        to: member.email,
        subject: `Profile Update Request ${action === 'approve' ? 'Approved' : 'Rejected'} - TechFinit`,
        html: `<p>Hi ${member.member?.fullName || 'Member'},</p><p>Your profile update request has been <b>${action}d</b>.</p>`
      });
    } catch (emailError) {
      console.warn('Could not send notification email, but request was reviewed.', emailError.message);
    }

    return {
      message: `Profile update request ${action}d successfully`,
      status: request.status
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  requestProfileUpdate,
  getChangeRequestStatus,
  cancelChangeRequest,
  getAllProfileUpdateRequests,
  reviewProfileUpdate
};
