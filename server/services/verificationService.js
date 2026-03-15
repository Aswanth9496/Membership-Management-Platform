const RegistrationOTP = require('../models/RegistrationOTP');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateOTP, getOTPExpiry, canSendOTP } = require('../utils/otpHelper');
const { sendEmail } = require('../utils/emailService');
const { emailVerificationTemplate } = require('../utils/emailTemplates');

const sendRegistrationOTP = async (email) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered. Please login.');
  }

  // 2. Check for existing OTP cooldown
  const existingOTP = await RegistrationOTP.findOne({ email });
  if (existingOTP) {
    const cooldownStatus = canSendOTP(existingOTP.lastSentAt);
    if (!cooldownStatus.allowed) {
      throw new ApiError(429, `Please wait ${cooldownStatus.remainingSeconds} seconds before requesting a new code.`);
    }
  }

  // 3. Generate OTP
  const otp = generateOTP();
  const expiresAt = getOTPExpiry();

  // 4. Save/Update OTP record
  await RegistrationOTP.findOneAndUpdate(
    { email },
    { 
      otp, 
      expiresAt, 
      isVerified: false, 
      attempts: 0, 
      lastSentAt: new Date() 
    },
    { upsert: true, new: true }
  );

  // 5. Send Email
  console.log(`[Email Log] Sending Registration Verification OTP to: ${email}`);
  const emailHtml = emailVerificationTemplate('Future Member', otp);
  
  try {
    const info = await sendEmail({
      to: email,
      subject: '✅ Email Verification - techfinit',
      html: emailHtml
    });
    console.log(`[Email Log] Verification OTP sent successfully to ${email}. MessageID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send verification email to ${email}:`, err.message);
    throw new ApiError(500, 'Failed to send verification email. Please try again later.');
  }

  return { message: 'Verification code sent to your email.' };
};

const verifyRegistrationOTP = async (email, otp) => {
  const otpRecord = await RegistrationOTP.findOne({ email });

  if (!otpRecord) {
    throw new ApiError(400, 'No verification code found. Please request a new one.');
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  if (otpRecord.attempts >= 5) {
    throw new ApiError(429, 'Too many failed attempts. Please request a new code.');
  }

  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    throw new ApiError(400, `Invalid verification code. ${remaining} attempts remaining.`);
  }

  // Mark as verified
  otpRecord.isVerified = true;
  await otpRecord.save();

  console.log(`[Email Log] Email verified successfully for: ${email}`);
  return { message: 'Email verified successfully! You can now complete your registration.' };
};

module.exports = {
  sendRegistrationOTP,
  verifyRegistrationOTP
};
