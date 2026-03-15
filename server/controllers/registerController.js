const { registerUser, formatUserResponse } = require('../services/registerService');
const { createdResponse, successResponse } = require('../utils/responseHelper');

const register = async (req, res) => {
  // Handle files if uploaded via multipart/form-data
  if (req.files) {
    const baseUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/`;
    req.body.documents = req.body.documents || {};
    
    const fileFields = [
      'agencyAddressProof',
      'activityLicense',
      'shopPhoto',
      'businessCard',
      'agencyLogo',
      'memberPhoto',
      'additionalDoc'
    ];

    fileFields.forEach(field => {
      if (req.files[field]) {
        req.body.documents[field] = {
          url: baseUrl + req.files[field][0].filename,
          publicId: req.files[field][0].filename,
          uploadedAt: new Date()
        };
      }
    });
  }

  // Handle references if passed (assume they come as an array or comma-separated string)
  if (req.body.references) {
    req.body.referral = req.body.referral || {};
    if (typeof req.body.references === 'string') {
      req.body.referral.references = req.body.references.split(',').filter(id => id.trim());
    } else {
      req.body.referral.references = req.body.references;
    }
  }

  console.log('--- Register Request ---');
  console.log('Body Keys:', Object.keys(req.body));
  console.log('References (raw):', req.body.references);
  console.log('Referral:', JSON.stringify(req.body.referral, null, 2));
  console.log('Files:', req.files ? Object.keys(req.files) : 'None');

  const user = await registerUser(req.body);
  const userData = formatUserResponse(user);

  createdResponse(
    res,
    { user: userData },
    'Registration successful! Your application has been submitted for document verification. Please login to continue.'
  );
};

const User = require('../models/User');
const getApprovedMembers = async (req, res) => {
  const { search } = req.query;
  const query = { status: 'approved' };

  if (search) {
    query.$or = [
      { 'member.fullName': { $regex: search, $options: 'i' } },
      { 'establishment.name': { $regex: search, $options: 'i' } },
      { membershipNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'member.mobile': { $regex: search, $options: 'i' } }
    ];
  }

  const members = await User.find(query)
    .select('_id member.fullName establishment.name membershipNumber email')
    .limit(5)
    .lean();

  successResponse(res, { members }, 'Approved members retrieved successfully');
};

module.exports = {
  register,
  getApprovedMembers,
};
