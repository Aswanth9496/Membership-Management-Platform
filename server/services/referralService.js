const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Get referral data for a specific member
 * @param {string} memberId 
 */
const getReferralData = async (memberId) => {
  const member = await User.findById(memberId)
    .select('referral.referralCode referral.referredMembers')
    .populate('referral.referredMembers', 'member.fullName establishment.name email status createdAt')
    .lean();

  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  return {
    referralCode: member.referral?.referralCode,
    referredMembers: member.referral?.referredMembers || []
  };
};

module.exports = {
  getReferralData
};
