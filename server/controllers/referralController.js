const { getReferralData } = require('../services/referralService');
const { successResponse } = require('../utils/responseHelper');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * Get current member's referral data
 */
const getMyReferrals = asyncHandler(async (req, res) => {
  const memberId = req.member.id;
  const data = await getReferralData(memberId);
  successResponse(res, data, 'Referral data retrieved successfully');
});

module.exports = {
  getMyReferrals
};
