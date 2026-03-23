const User = require('../models/User');
const ReferenceRequest = require('../models/ReferenceRequest');
const ApiError = require('../utils/ApiError');

// Helper to attach reference statuses to members
const attachReferenceStatuses = async (members) => {
  const memberIds = members.map(m => m._id || m.id);
  const referenceRequests = await ReferenceRequest.find({ applicantId: { $in: memberIds } })
    .populate('referencedMemberId', 'member.fullName email membershipNumber')
    .lean();

  return members.map(member => {
    const memberId = (member._id || member.id).toString();
    const requests = referenceRequests.filter(req => req.applicantId.toString() === memberId);
    
    return {
      ...member,
      referenceStatuses: requests.map(req => ({
        id: req._id,
        name: req.referencedMemberId?.member?.fullName || 'N/A',
        email: req.referencedMemberId?.email || 'N/A',
        membershipNumber: req.referencedMemberId?.membershipNumber || 'N/A',
        status: req.status,
        verifiedAt: req.verifiedAt
      }))
    };
  });
};

// Get all members with comprehensive filtering and pagination
const getAllMembers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    role
  } = options;

  try {
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Role filter
    if (role) {
      query['membershipDetails.membershipType'] = role;
    }

    // Search filter (name, email, membershipNumber)
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'member.fullName': { $regex: escapedSearch, $options: 'i' } },
        { 'establishment.name': { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { membershipNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get members with pagination
    const members = await User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    // Get total count
    const totalMembers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    // Attach reference statuses
    const membersWithReferences = await attachReferenceStatuses(members);

    return {
      members: membersWithReferences,
      pagination: {
        currentPage: page,
        totalPages,
        totalMembers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        status,
        search,
        sortBy,
        sortOrder,
        role
      }
    };

  } catch (error) {
    console.error('Error in getAllMembers:', error);
    throw new ApiError(500, 'Failed to retrieve members');
  }
};

// Update member status
const updateMemberStatus = async (memberId, newStatus, rejectionReason, adminRole, adminName) => {
  try {
    // Validate member exists
    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Update status
    member.status = newStatus;
    
    // Add rejection reason if rejecting
    if (newStatus === 'rejected' && rejectionReason) {
      member.rejectionReason = rejectionReason;
    }

    // Track status change
    if (!member.statusHistory) {
      member.statusHistory = [];
    }
    
    member.statusHistory.push({
      status: newStatus,
      changedBy: {
        adminId: adminRole === 'admin' ? null : adminRole,
        adminName,
        role: adminRole
      },
      changedAt: new Date(),
      rejectionReason: newStatus === 'rejected' ? rejectionReason : null
    });

    await member.save();

    return {
      memberId: member._id,
      name: member.name,
      email: member.email,
      previousStatus: member.statusHistory[member.statusHistory.length - 2]?.status || 'N/A',
      newStatus,
      changedBy: adminName,
      changedAt: new Date()
    };

  } catch (error) {
    console.error('Error in updateMemberStatus:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update member status');
  }
};

// Get members pending approval (at least one role needs to approve)
const getPendingApprovals = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    // Query: Find members where at least one approval is false
    const query = {
      status: 'submitted',
      $or: [
        { 'approvals.president.approved': false },
        { 'approvals.secretary.approved': false },
        { 'approvals.treasurer.approved': false },
      ],
    };

    // Get members with pagination (ALL FIELDS for admin review)
    const members = await User.find(query)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .select('-password') // Exclude password only
      .lean();

    // Get total count
    const totalMembers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    // Format members data - Return ALL fields for admin review
    const formattedMembers = members.map((member) => ({
      id: member._id.toString(),
      membershipNumber: member.membershipNumber || 'N/A',
      membershipType: member.membershipType,

      // Basic Info (for list view)
      name: member.member?.fullName || 'N/A',
      company: member.establishment?.name || 'N/A',
      email: member.email || 'N/A',
      phone: member.member?.mobile || 'N/A',

      // Complete Establishment Details
      establishment: {
        name: member.establishment?.name || null,
        tradeName: member.establishment?.tradeName || null,
        yearOfEstablishment: member.establishment?.yearOfEstablishment || null,
        officialClassification: member.establishment?.officialClassification || null,
        businessType: member.establishment?.businessType || null,
        organizationalStatus: member.establishment?.organizationalStatus || null,
        officialEmail: member.establishment?.officialEmail || null,
        gstRegistered: member.establishment?.gstRegistered || false,
      },

      // Complete Location Details
      location: {
        district: member.location?.district || null,
        region: member.location?.region || null,
        city: member.location?.city || null,
        pinCode: member.location?.pinCode || null,
        registeredAddress: member.location?.registeredAddress || null,
        communicationAddress: member.location?.communicationAddress || null,
        isSameAddress: member.location?.isSameAddress || false,
      },

      // Complete Member Details
      member: {
        officeType: member.member?.officeType || null,
        roleInAgency: member.member?.roleInAgency || null,
        fullName: member.member?.fullName || null,
        dateOfBirth: member.member?.dateOfBirth || null,
        mobile: member.member?.mobile || null,
        landline: member.member?.landline || null,
      },

      // Partner Details
      partner: {
        name: member.partner?.name || null,
        mobile: member.partner?.mobile || null,
      },

      // Staff Details
      staff: {
        name: member.staff?.name || null,
        mobile: member.staff?.mobile || null,
      },

      // Documents
      documents: {
        agencyAddressProof: member.documents?.agencyAddressProof || null,
        shopPhoto: member.documents?.shopPhoto || null,
        businessCard: member.documents?.businessCard || null,
      },

      // Status & Rejection
      status: member.status || 'submitted',
      rejectionReason: member.rejectionReason || null,

      // Approvals (Complete with dates and remarks)
      approvals: {
        president: {
          approved: member.approvals?.president?.approved || false,
          approvedAt: member.approvals?.president?.approvedAt || null,
          remarks: member.approvals?.president?.remarks || null,
        },
        secretary: {
          approved: member.approvals?.secretary?.approved || false,
          approvedAt: member.approvals?.secretary?.approvedAt || null,
          remarks: member.approvals?.secretary?.remarks || null,
        },
        treasurer: {
          approved: member.approvals?.treasurer?.approved || false,
          approvedAt: member.approvals?.treasurer?.approvedAt || null,
          remarks: member.approvals?.treasurer?.remarks || null,
        },
      },

      // Payment Information
      payment: {
        status: member.payment?.status || 'pending',
        amount: member.payment?.amount || null,
        transactionId: member.payment?.transactionId || null,
        paymentDate: member.payment?.paymentDate || null,
        paymentMethod: member.payment?.paymentMethod || null,
      },

      // Referral Information
      referral: {
        referredBy: member.referral?.referredBy || null,
        referralCode: member.referral?.referralCode || null,
        referredMembers: member.referral?.referredMembers || [],
      },

      // Certificate Information
      certificate: {
        generated: member.certificate?.generated || false,
        certificateNumber: member.certificate?.certificateNumber || null,
        issueDate: member.certificate?.issueDate || null,
        expiryDate: member.certificate?.expiryDate || null,
        url: member.certificate?.url || null,
        publicId: member.certificate?.publicId || null,
      },

      // Verification Flags
      isEmailVerified: member.isEmailVerified || false,
      isMobileVerified: member.isMobileVerified || false,

      // Profile Change Request
      profileChangeRequest: {
        pending: member.profileChangeRequest?.pending || false,
        requestedChanges: member.profileChangeRequest?.requestedChanges || null,
        requestedAt: member.profileChangeRequest?.requestedAt || null,
      },

      // Activity Info
      lastLogin: member.lastLogin || null,
      isActive: member.isActive,
      registrationDate: member.createdAt,
      updatedAt: member.updatedAt,
    }));

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages,
      totalMembers,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    // Attach reference statuses
    const membersWithReferences = await attachReferenceStatuses(formattedMembers);

    return {
      members: membersWithReferences,
      pagination,
    };
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    throw new ApiError(500, 'Failed to retrieve pending approvals');
  }
};

// Get members pending approval for specific role
const getPendingApprovalsByRole = async (role, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    // Validate role
    const validRoles = ['president', 'secretary', 'treasurer'];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Query: Find members where specific role approval is false
    const query = {
      status: 'submitted',
      [`approvals.${role}.approved`]: false,
    };

    // Get members with pagination (ALL FIELDS for admin review)
    const members = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password') // Exclude password only
      .lean();

    // Get total count
    const totalMembers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    // Format members data - Return ALL fields for admin review
    const formattedMembers = members.map((member) => ({
      id: member._id.toString(),
      membershipNumber: member.membershipNumber || 'N/A',
      membershipType: member.membershipType,

      // Basic Info (for list view)
      name: member.member?.fullName || 'N/A',
      company: member.establishment?.name || 'N/A',
      email: member.email || 'N/A',
      phone: member.member?.mobile || 'N/A',

      // Complete Establishment Details
      establishment: {
        name: member.establishment?.name || null,
        tradeName: member.establishment?.tradeName || null,
        yearOfEstablishment: member.establishment?.yearOfEstablishment || null,
        officialClassification: member.establishment?.officialClassification || null,
        businessType: member.establishment?.businessType || null,
        organizationalStatus: member.establishment?.organizationalStatus || null,
        officialEmail: member.establishment?.officialEmail || null,
        gstRegistered: member.establishment?.gstRegistered || false,
      },

      // Complete Location Details
      location: {
        district: member.location?.district || null,
        region: member.location?.region || null,
        city: member.location?.city || null,
        pinCode: member.location?.pinCode || null,
        registeredAddress: member.location?.registeredAddress || null,
        communicationAddress: member.location?.communicationAddress || null,
        isSameAddress: member.location?.isSameAddress || false,
      },

      // Complete Member Details
      member: {
        officeType: member.member?.officeType || null,
        roleInAgency: member.member?.roleInAgency || null,
        fullName: member.member?.fullName || null,
        dateOfBirth: member.member?.dateOfBirth || null,
        mobile: member.member?.mobile || null,
        landline: member.member?.landline || null,
      },

      // Partner Details
      partner: {
        name: member.partner?.name || null,
        mobile: member.partner?.mobile || null,
      },

      // Staff Details
      staff: {
        name: member.staff?.name || null,
        mobile: member.staff?.mobile || null,
      },

      // Documents
      documents: {
        agencyAddressProof: member.documents?.agencyAddressProof || null,
        shopPhoto: member.documents?.shopPhoto || null,
        businessCard: member.documents?.businessCard || null,
      },

      // Status & Rejection
      status: member.status || 'submitted',
      rejectionReason: member.rejectionReason || null,

      // Approvals (Complete with dates and remarks)
      approvals: {
        president: {
          approved: member.approvals?.president?.approved || false,
          approvedAt: member.approvals?.president?.approvedAt || null,
          remarks: member.approvals?.president?.remarks || null,
        },
        secretary: {
          approved: member.approvals?.secretary?.approved || false,
          approvedAt: member.approvals?.secretary?.approvedAt || null,
          remarks: member.approvals?.secretary?.remarks || null,
        },
        treasurer: {
          approved: member.approvals?.treasurer?.approved || false,
          approvedAt: member.approvals?.treasurer?.approvedAt || null,
          remarks: member.approvals?.treasurer?.remarks || null,
        },
      },

      // Payment Information
      payment: {
        status: member.payment?.status || 'pending',
        amount: member.payment?.amount || null,
        transactionId: member.payment?.transactionId || null,
        paymentDate: member.payment?.paymentDate || null,
        paymentMethod: member.payment?.paymentMethod || null,
      },

      // Referral Information
      referral: {
        referredBy: member.referral?.referredBy || null,
        referralCode: member.referral?.referralCode || null,
        referredMembers: member.referral?.referredMembers || [],
      },

      // Certificate Information
      certificate: {
        generated: member.certificate?.generated || false,
        certificateNumber: member.certificate?.certificateNumber || null,
        issueDate: member.certificate?.issueDate || null,
        expiryDate: member.certificate?.expiryDate || null,
        url: member.certificate?.url || null,
        publicId: member.certificate?.publicId || null,
      },

      // Verification Flags
      isEmailVerified: member.isEmailVerified || false,
      isMobileVerified: member.isMobileVerified || false,

      // Profile Change Request
      profileChangeRequest: {
        pending: member.profileChangeRequest?.pending || false,
        requestedChanges: member.profileChangeRequest?.requestedChanges || null,
        requestedAt: member.profileChangeRequest?.requestedAt || null,
      },

      // Activity Info
      lastLogin: member.lastLogin || null,
      isActive: member.isActive,
      registrationDate: member.createdAt,
      updatedAt: member.updatedAt,
    }));

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages,
      totalMembers,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    // Attach reference statuses
    const membersWithReferences = await attachReferenceStatuses(formattedMembers);

    return {
      members: membersWithReferences,
      pagination,
    };
  } catch (error) {
    console.error('Error getting pending approvals by role:', error);
    throw error;
  }
};

// Update member approval (approve/reject)
const updateMemberApproval = async (memberId, adminRole, action, remarks) => {
  try {
    // Validate role
    const validRoles = ['president', 'secretary', 'treasurer'];
    if (!validRoles.includes(adminRole)) {
      throw new ApiError(400, 'Invalid admin role');
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      throw new ApiError(400, 'Action must be either "approve" or "reject"');
    }

    // Find member
    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Update the specific role's approval
    const currentTimestamp = new Date();

    if (action === 'approve') {
      // Approve
      member.approvals[adminRole].approved = true;
      member.approvals[adminRole].approvedAt = currentTimestamp;
      member.approvals[adminRole].remarks = remarks || null;

      if (member.status === 'rejected') {
        member.status = 'submitted';
        member.rejectionReason = null;
      }

      // Check if all 3 roles have approved
      const allApproved =
        member.approvals.president.approved &&
        member.approvals.secretary.approved &&
        member.approvals.treasurer.approved;

      if (allApproved) {
        member.status = 'verified';
        console.log(`✅ All approvals complete for member: ${member.member.fullName}. Status changed to 'verified'. Payment pending.`);
      }
    } else {
      // Reject
      member.approvals[adminRole].approved = false;
      member.approvals[adminRole].approvedAt = currentTimestamp;
      member.approvals[adminRole].remarks = remarks || null;

      // Set rejection reason at top level
      if (remarks) {
        member.rejectionReason = remarks;
      }
      // Officially move them out of pending queue into rejected graveyard
      member.status = 'rejected';
    }

    // Save changes (only validate modified fields to bypass old mock-data schema breaking)
    await member.save({ validateModifiedOnly: true });

    // Check if all approvals are complete
    const allApproved =
      member.approvals.president.approved &&
      member.approvals.secretary.approved &&
      member.approvals.treasurer.approved;

    // Create response message
    let responseMessage = action === 'approve' ? 'Member approved successfully' : 'Member rejected successfully';

    // If all approved and status is verified, add payment pending message
    if (allApproved && member.status === 'verified') {
      responseMessage = 'Member approved successfully. All approvals complete! Application status: Verified. Payment pending for membership activation.';
    }

    return {
      message: responseMessage,
      memberId: member._id,
      memberName: member.member?.fullName,
      updatedApproval: {
        role: adminRole,
        approved: member.approvals[adminRole].approved,
        approvedAt: member.approvals[adminRole].approvedAt,
        remarks: member.approvals[adminRole].remarks,
      },
      allApproved,
      status: member.status,
      paymentPending: allApproved && member.status === 'verified',
    };
  } catch (error) {
    console.error('Error updating member approval:', error);
    throw error;
  }
};

// Delete user profile entirely
const deleteUserProfile = async (memberId) => {
  try {
    // Find and delete member
    const member = await User.findByIdAndDelete(memberId);

    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    return {
      message: 'Member profile deleted successfully',
      deletedMember: {
        id: member._id,
        name: member.member?.fullName || 'N/A',
        email: member.email,
        membershipNumber: member.membershipNumber || null,
        deletedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// Get members with approved or rejected status
const getApprovedOrRejectedMembers = async (page = 1, limit = 10, filterStatus = null) => {
  try {
    const skip = (page - 1) * limit;

    let query = {};
    if (filterStatus === 'rejected') {
      query = { status: 'rejected' };
    } else {
      query = {
        'approvals.president.approved': true,
        'approvals.secretary.approved': true,
        'approvals.treasurer.approved': true,
        status: { $ne: 'rejected' }
      };
    }

    const members = await User.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    const totalMembers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    const formattedMembers = members.map((member) => ({
      id: member._id.toString(),
      membershipNumber: member.membershipNumber || 'N/A',
      name: member.member?.fullName || 'N/A',
      company: member.establishment?.name || 'N/A',
      email: member.email || 'N/A',
      phone: member.member?.mobile || 'N/A',
      status: member.status,
      isActive: member.isActive,
      rejectionReason: member.rejectionReason || null,
      updatedAt: member.updatedAt,
      registrationDate: member.createdAt,
    }));

    const pagination = {
      currentPage: page,
      totalPages,
      totalMembers,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    // Attach reference statuses
    const membersWithReferences = await attachReferenceStatuses(formattedMembers);

    return {
      members: membersWithReferences,
      pagination,
    };
  } catch (error) {
    console.error('Error getting processed members:', error);
    throw new ApiError(500, 'Failed to retrieve processed members');
  }
};

// Block or Unblock a member
const toggleMemberBlockStatus = async (memberId, action) => {
  try {
    if (!['block', 'unblock'].includes(action)) {
      throw new ApiError(400, 'Action must be "block" or "unblock"');
    }

    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    member.isActive = action === 'unblock';
    await member.save();

    return {
      message: `Member ${action}ed successfully`,
      memberId: member._id,
      memberName: member.member?.fullName || 'N/A',
      isActive: member.isActive,
    };
  } catch (error) {
    console.error(`Error trying to ${action} member:`, error);
    throw error;
  }
};

module.exports = {
  getAllMembers,
  updateMemberStatus,
  getPendingApprovals,
  getPendingApprovalsByRole,
  updateMemberApproval,
  deleteUserProfile,
  getApprovedOrRejectedMembers,
  toggleMemberBlockStatus,
};
