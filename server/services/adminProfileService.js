const User = require('../models/User');
const Admin = require('../models/Admin');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');
const { sendEmail } = require('../utils/emailService');
const ApiError = require('../utils/ApiError');

// Helper: Get comparison object
const getComparison = (current, requested) => {
  const comparison = {};
  
  const processObject = (currentObj, requestedObj, prefix = '') => {
    for (const key in requestedObj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (requestedObj[key] && typeof requestedObj[key] === 'object' && !Array.isArray(requestedObj[key]) && !(requestedObj[key] instanceof Date)) {
        // Nested object
        if (!comparison[fullKey]) {
          // Note: We don't necessarily need the parent key in comparison, 
          // but we need to recurse with the fullKey prefix.
        }
        processObject(currentObj?.[key] || {}, requestedObj[key], fullKey);
      } else {
        // Direct value
        const currentValue = currentObj?.[key];
        const requestedValue = requestedObj[key];
        const changed = JSON.stringify(currentValue) !== JSON.stringify(requestedValue);
        
        // Use the section identifier (e.g., 'member', 'location') as the first level key 
        // to match MODAL_SECTIONS logic in frontend
        const parts = fullKey.split('.');
        const section = parts[0];
        const fieldPath = parts.slice(1).join('.');
        
        if (!comparison[section]) {
          comparison[section] = {};
        }
        
        comparison[section][fieldPath || key] = {
          current: currentValue,
          requested: requestedValue,
          changed,
        };
      }
    }
  };
  
  processObject(current, requested);
  return comparison;
};

// 1. Get All Profile Change Requests
const getAllProfileChangeRequests = async (filters = {}, pagination = {}) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    // Build query on ProfileUpdateRequest collection
    const query = { status };

    // Get total count
    const totalRequests = await ProfileUpdateRequest.countDocuments(query);

    // Get requests with pagination and populate user details
    const requests = await ProfileUpdateRequest.find(query)
      .populate('userId', 'email member.fullName member.mobile establishment.name membershipNumber status')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format response
    const formattedRequests = requests.map(update => {
      const user = update.userId;
      if (!user) return null;

      const pendingFor = Math.floor((new Date() - new Date(update.requestedAt)) / (1000 * 60));
      const hours = Math.floor(pendingFor / 60);
      const minutes = pendingFor % 60;

      // Count changed fields
      let totalChanges = 0;
      const changedFields = [];
      
      const flattenChanges = (obj, prefix = '') => {
        for (const key in obj) {
          const fullPath = prefix ? `${prefix}.${key}` : key;
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            flattenChanges(obj[key], fullPath);
          } else {
            changedFields.push(fullPath);
            totalChanges++;
          }
        }
      };
      flattenChanges(update.requestedData);

      return {
        id: update._id,
        userId: user._id,
        memberDetails: {
          fullName: user.member?.fullName || 'N/A',
          email: user.email,
          mobile: user.member?.mobile || 'N/A',
          establishmentName: user.establishment?.name || 'N/A',
          membershipNumber: user.membershipNumber || 'N/A',
          status: user.status,
        },
        changeRequest: {
          status: update.status,
          requestedAt: update.requestedAt,
          pendingFor: `${hours} hours ${minutes} minutes`,
          totalChanges,
          changedFields,
        },
      };
    }).filter(Boolean);

    // Calculate summary
    const totalPending = await ProfileUpdateRequest.countDocuments({ status: 'pending' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pendingToday = await ProfileUpdateRequest.countDocuments({
      status: 'pending',
      requestedAt: { $gte: today },
    });

    return {
      requests: formattedRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        limit,
        hasNextPage: page * limit < totalRequests,
        hasPrevPage: page > 1,
      },
      summary: {
        totalPending,
        pendingToday,
      },
    };
  } catch (error) {
    console.error('Error getting profile change requests:', error);
    throw error;
  }
};

// 2. Get Detailed Profile Change Request
const getProfileChangeRequestDetails = async (updateId) => {
  try {
    const update = await ProfileUpdateRequest.findById(updateId)
      .populate('userId', 'email member location establishment partner staff membershipNumber status createdAt')
      .lean();
    
    if (!update) {
      throw new ApiError(404, 'Profile update request not found');
    }

    const user = update.userId;
    if (!user) {
      throw new ApiError(404, 'Member associated with this request not found');
    }

    // Calculate pending time
    const pendingFor = Math.floor((new Date() - new Date(update.requestedAt)) / (1000 * 60));
    const hours = Math.floor(pendingFor / 60);
    const minutes = pendingFor % 60;

    // Get comparison using the correct fields from the separate collection
    const comparison = getComparison(update.currentData, update.requestedData);

    // Get changed and unchanged fields
    const changedFields = [];
    const unchangedFields = [];

    const processComparison = (obj, prefix = '') => {
      for (const key in obj) {
        if (obj[key].changed !== undefined) {
          const fieldName = `${prefix}${key}`;
          if (obj[key].changed) {
            changedFields.push(fieldName);
          } else {
            unchangedFields.push(fieldName);
          }
        } else if (typeof obj[key] === 'object') {
          processComparison(obj[key], `${prefix}${key}.`);
        }
      }
    };

    processComparison(comparison);

    return {
      member: {
        id: user._id,
        fullName: user.member?.fullName || 'N/A',
        email: user.email,
        membershipNumber: user.membershipNumber || 'N/A',
        status: user.status,
        registeredOn: user.createdAt,
      },
      changeRequest: {
        id: update._id,
        status: update.status,
        requestedAt: update.requestedAt,
        pendingFor: `${hours} hours ${minutes} minutes`,
      },
      currentData: update.currentData,
      requestedData: update.requestedData,
      comparison,
      summary: {
        totalChanges: changedFields.length,
        changedFields,
        unchangedFields,
      },
    };
  } catch (error) {
    console.error('Error getting profile change request details:', error);
    throw error;
  }
};

// 3. Review Profile Change Request (Approve/Reject)
const reviewProfileChangeRequest = async (updateId, adminId, action, remarks) => {
  try {
    // Find the update request
    const update = await ProfileUpdateRequest.findById(updateId);
    if (!update) {
      throw new ApiError(404, 'Profile update request not found');
    }

    if (update.status !== 'pending') {
      throw new ApiError(400, 'This request has already been processed');
    }

    // Find member
    const member = await User.findById(update.userId);
    if (!member) {
      throw new ApiError(404, 'Member associated with this request not found');
    }

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    // Process based on action
    if (action === 'approve') {
      // Apply changes to member profile
      const changes = update.requestedData;
      
      const deepMerge = (source, target) => {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date)) {
            if (!target[key]) target[key] = {};
            deepMerge(source[key], target[key]);
          } else {
            target[key] = source[key];
          }
        }
      };

      deepMerge(changes, member);
      
      // Mark fields as modified for Mongoose to detect deep changes
      if (changes.member) member.markModified('member');
      if (changes.location) member.markModified('location');
      if (changes.establishment) member.markModified('establishment');
      if (changes.partner) member.markModified('partner');
      if (changes.staff) member.markModified('staff');
      if (changes.documents) member.markModified('documents');

      await member.save();

      // Update request status
      update.status = 'approved';
      update.reviewedAt = new Date();
      update.reviewedBy = admin._id;
      // We can also store extra remarks in the model if we update the schema, 
      // but for now let's just save.
      await update.save();

      // Count applied changes for email
      let totalChangesApplied = 0;
      const flattenChanges = (obj) => {
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            flattenChanges(obj[key]);
          } else {
            totalChangesApplied++;
          }
        }
      };
      flattenChanges(changes);

      // Send approval email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Profile Update Approved</h2>
          <p>Hi ${member.member?.fullName || 'Member'},</p>
          <p>Good news! Your profile update request has been approved.</p>
          <p><strong>Approved By:</strong> ${admin.fullName} (${admin.role})</p>
          ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
          <p>Your profile has been synchronized successfully.</p>
        </body>
        </html>
      `;

      await sendEmail({
        to: member.email,
        subject: 'Profile Updated Successfully',
        html: emailContent,
      });

      return {
        message: 'Profile update request approved and synchronized.',
        userId: member._id,
        action: 'approved',
      };

    } else if (action === 'reject') {
      if (!remarks) {
        throw new ApiError(400, 'Rejection reason is required');
      }

      // Update request status
      update.status = 'rejected';
      update.rejectionReason = remarks;
      update.reviewedAt = new Date();
      update.reviewedBy = admin._id;
      await update.save();

      // Send rejection email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Profile Update Rejected</h2>
          <p>Hi ${member.member?.fullName || 'Member'},</p>
          <p>Your profile update request has been reviewed and rejected.</p>
          <p><strong>Reason:</strong> ${remarks}</p>
          <p><strong>Reviewed By:</strong> ${admin.fullName} (${admin.role})</p>
        </body>
        </html>
      `;

      await sendEmail({
        to: member.email,
        subject: 'Profile Update Request Rejected',
        html: emailContent,
      });

      return {
        message: 'Profile update request rejected.',
        userId: member._id,
        action: 'rejected',
      };
    } else {
      throw new ApiError(400, 'Invalid action. Use "approve" or "reject"');
    }
  } catch (error) {
    console.error('Error reviewing profile change request:', error);
    throw error;
  }
};

module.exports = {
  getAllProfileChangeRequests,
  getProfileChangeRequestDetails,
  reviewProfileChangeRequest,
};
