// Forgot Password OTP Email Template
const forgotPasswordTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { color: #e74c3c; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Use the OTP below to proceed:</p>
          
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          
          <p><strong>⏰ Valid for 10 minutes</strong></p>
          <p>Please do not share this OTP with anyone for security reasons.</p>
          
          <div class="warning">
            ⚠️ If you didn't request this, please ignore this email or contact support.
          </div>
        </div>
        <div class="footer">
          <p>© 2024 TechFinit. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email Verification OTP Template
const emailVerificationTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp { font-size: 36px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Email Verification</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for registering! Please verify your email using the OTP below:</p>
          
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          
          <p><strong>⏰ Valid for 10 minutes</strong></p>
          <p>Enter this OTP to complete your registration.</p>
        </div>
        <div class="footer">
          <p>© 2024 TechFinit. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Welcome Email Template (After Registration)
const welcomeTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to TechFinit!</h1>
        </div>
        <div class="content">
          <div class="success">
            <h2 style="margin: 0;">✅ Registration Successful!</h2>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Congratulations! Your account has been created successfully.</p>
          <p>You can now access all the features of our platform.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 TechFinit. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Password Reset Success Template
const passwordResetSuccessTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { color: #e74c3c; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
          <div class="success">
            <h2 style="margin: 0;">🔒 Your Password Has Been Reset</h2>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your password has been successfully reset. You can now login with your new password.</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't make this change, please contact support immediately.
          </div>
        </div>
        <div class="footer">
          <p>© 2024 TechFinit. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Reference Request Template
const referenceRequestTemplate = (name, applicantName, agencyName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Reference Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You have been listed as a reference by an applicant during their membership registration at <strong>techfinit</strong>.</p>
          
          <div class="info-box">
            <p style="margin: 5px 0;"><strong>Applicant Name:</strong> ${applicantName}</p>
            <p style="margin: 5px 0;"><strong>Agency Name:</strong> ${agencyName}</p>
          </div>
          
          <p>Please log in to your dashboard to confirm whether you know this person and verify the reference.</p>
          
          <p>Verifying references helps us maintain a trusted network of tourism professionals.</p>
        </div>
        <div class="footer">
          <p>© 2024 techfinit. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// New Event Notification Template
const eventNotificationTemplate = (memberName, eventData) => {
  const { title, description, eventType, eventDate, venue, isPaid, price } = eventData;
  
  // Format dates and times safely
  const startDate = new Date(eventDate.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const pricingText = isPaid ? `Registration Fee: ₹${price}` : 'Free Event';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px 30px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #0ea5e9; }
        .detail-row { margin-bottom: 12px; display: flex; align-items: flex-start; }
        .detail-label { font-weight: bold; color: #64748b; width: 100px; flex-shrink: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { color: #0f172a; font-weight: 600; }
        .cta-container { text-align: center; margin-top: 35px; }
        .btn { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s; }
        .btn:hover { background: #0284c7; }
        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>Upcoming ${eventType}</p>
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${memberName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">We are excited to announce a new event! As a valued member of techfinit, we would love to see you there.</p>
          
          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${startDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${eventDate.startTime} - ${eventDate.endTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-value">${venue.name}, ${venue.city}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 0;">
              <span class="detail-label">Entry:</span>
              <span class="detail-value" style="color: #059669;">${pricingText}</span>
            </div>
          </div>
          
          <p style="font-size: 15px; color: #475569; line-height: 1.8;">${description}</p>
          
          <div class="cta-container">
            <a href="https://techfinit-membership.vercel.app/member/events" class="btn">View Event & Register</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 techfinit. All rights reserved.</p>
          <p>You received this email because you are a registered member of techfinit.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  forgotPasswordTemplate,
  emailVerificationTemplate,
  welcomeTemplate,
  passwordResetSuccessTemplate,
  referenceRequestTemplate,
  eventNotificationTemplate,
};
