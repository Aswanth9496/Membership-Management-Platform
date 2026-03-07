const { registerUser, formatUserResponse } = require('../services/registerService');
const { createdResponse, successResponse } = require('../utils/responseHelper');

const register = async (req, res) => {
  const user = await registerUser(req.body);
  const userData = formatUserResponse(user);

  createdResponse(
    res,
    { user: userData },
    'Registration successful! Your application has been submitted for document verification. Please login to continue.'
  );
};

const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${req.file.filename}`;

  successResponse(res, { url: fileUrl, publicId: req.file.filename }, 'File uploaded successfully');
};

module.exports = {
  register,
  uploadDocument,
};
