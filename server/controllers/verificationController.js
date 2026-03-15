const { sendRegistrationOTP, verifyRegistrationOTP } = require('../services/verificationService');
const { successResponse } = require('../utils/responseHelper');
const asyncHandler = require('../middlewares/asyncHandler');

const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const result = await sendRegistrationOTP(email);
  successResponse(res, result, result.message);
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }
  const result = await verifyRegistrationOTP(email, otp);
  successResponse(res, result, result.message);
});

module.exports = {
  sendOTP,
  verifyOTP
};
