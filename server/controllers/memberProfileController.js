const { requestProfileUpdate, getChangeRequestStatus, cancelChangeRequest } = require('../services/memberProfileService');
const { successResponse } = require('../utils/responseHelper');

// Request Profile Update
const requestUpdate = async (req, res) => {
  const memberId = req.member._id;
  const { requestedChanges } = req.body;

  const result = await requestProfileUpdate(memberId, requestedChanges);

  successResponse(res, result, result.message);
};

// Get Change Request Status
const getStatus = async (req, res) => {
  const memberId = req.member._id;

  const result = await getChangeRequestStatus(memberId);

  successResponse(res, result, result.message);
};

// Cancel Pending Request
const cancelRequest = async (req, res) => {
  const memberId = req.member._id;

  const result = await cancelChangeRequest(memberId);

  successResponse(res, result, result.message);
};

const PDFDocument = require('pdfkit');
const User = require('../models/User');

// Download PDF certificate dynamically generated from actual DB facts
const downloadCertificate = async (req, res) => {
  try {
    const memberId = req.member._id;
    const member = await User.findById(memberId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (member.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Certificate available only for approved members' });
    }

    const { certificate, establishment, member: memberInfo } = member;
    console.log(member);

    res.setHeader('Content-Type', 'application/pdf');
    
    // If it's the iframe rendering it, use 'inline'. If it's a direct download button click, use 'attachment'.
    const disposition = req.query.preview === 'true' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="membership_certificate_${member.membershipNumber || 'hub'}.pdf"`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      layout: 'landscape'
    });

    doc.pipe(res);

    // 1. Load the background template image
    const path = require('path');
    const templatePath = path.join(__dirname, '../public/templates/certificate_bg.png');
    
    // Draw the image exactly matching the A4 landscape dimensions
    doc.image(templatePath, 0, 0, { width: doc.page.width, height: doc.page.height });

    // 2. Inject Dynamic Variables over the template
    // The exact coordinates need to be fine-tuned based on the image's physical layout
    
    // Member Name / Establishment Name (Centered horizontally, positioned vertically over the "AIR ZOOM..." blank area)
    doc.fillColor('#334155')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(establishment?.name || establishment?.tradeName || memberInfo?.fullName || 'Registered Establishment', 0, 240, { align: 'center' });

    // Address / Secondary Details (Right underneath the name)
    doc.fillColor('#475569')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(memberInfo?.address?.city || 'Kerala', 0, 275, { align: 'center' });

    // Membership Number (e.g. "0112")
    const certNumber = certificate?.certificateNumber || member.membershipNumber || member._id.toString().substring(0, 4).toUpperCase();
    doc.fillColor('#475569')
       .fontSize(14)
       .font('Helvetica')
       .text(`Membership No: ${certNumber}`, 0, 310, { align: 'center' });

    // Dates
    // The "Valid Through 2025 - 2026"
    // To calculate the range correctly based on the certificate expiry
    let validityYear = '2025 - 2026';
    if (certificate?.expiryDate) {
       const expYear = new Date(certificate.expiryDate).getFullYear();
       validityYear = `${expYear - 1} - ${expYear}`;
    }
    
    doc.fillColor('#475569')
       .fontSize(14)
       .font('Helvetica')
       .text(`Valid Through ${validityYear}`, 80, 400); // Assuming this is aligned on the left like the image showed

    doc.end();

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating certificate.' });
    }
  }
};

// Upload Missing Document
const uploadMissingDocument = async (req, res) => {
  const memberId = req.member._id;
  const { documentType } = req.body;

  if (!['agencyAddressProof', 'shopPhoto', 'businessCard'].includes(documentType)) {
    return res.status(400).json({ success: false, message: 'Invalid document type' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const member = await User.findById(memberId);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  if (!member.documents) {
    member.documents = {};
  }

  // Construct local URL accessible via the static /uploads middleware we just created
  const fileUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${req.file.filename}`;

  member.documents[documentType] = {
    url: fileUrl,
    publicId: req.file.filename,
    uploadedAt: new Date()
  };

  await member.save();
  successResponse(res, null, 'Document uploaded successfully');
};

module.exports = {
  requestUpdate,
  getStatus,
  cancelRequest,
  downloadCertificate,
  uploadMissingDocument,
};
