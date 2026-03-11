const { registerUser, formatUserResponse } = require('../services/registerService');
const { createdResponse, successResponse } = require('../utils/responseHelper');

const register = async (req, res) => {
  // Handle files if uploaded via multipart/form-data
  if (req.files) {
    const baseUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/`;
    req.body.documents = req.body.documents || {};
    
    if (req.files.agencyAddressProof) {
      req.body.documents.agencyAddressProof = {
        url: baseUrl + req.files.agencyAddressProof[0].filename,
        publicId: req.files.agencyAddressProof[0].filename,
        uploadedAt: new Date()
      };
    }
    if (req.files.shopPhoto) {
      req.body.documents.shopPhoto = {
        url: baseUrl + req.files.shopPhoto[0].filename,
        publicId: req.files.shopPhoto[0].filename,
        uploadedAt: new Date()
      };
    }
    if (req.files.businessCard) {
      req.body.documents.businessCard = {
        url: baseUrl + req.files.businessCard[0].filename,
        publicId: req.files.businessCard[0].filename,
        uploadedAt: new Date()
      };
    }
  }
  console.log('--- Register Request ---');
  console.log('Body Keys:', Object.keys(req.body));
  console.log('Establishment:', req.body.establishment);
  console.log('Location:', req.body.location);
  console.log('Member:', req.body.member);
  console.log('Files:', req.files ? Object.keys(req.files) : 'None');

  const user = await registerUser(req.body);
  const userData = formatUserResponse(user);

  createdResponse(
    res,
    { user: userData },
    'Registration successful! Your application has been submitted for document verification. Please login to continue.'
  );
};

module.exports = {
  register,
};
