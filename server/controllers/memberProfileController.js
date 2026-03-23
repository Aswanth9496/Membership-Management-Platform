const { requestProfileUpdate, getChangeRequestStatus, cancelChangeRequest, directProfileUpdate } = require('../services/memberProfileService');
const { successResponse } = require('../utils/responseHelper');

// Request Profile Update
const requestUpdate = async (req, res) => {
  const memberId = req.member._id;
  
  // Ensure requestedChanges is an object (it should be parsed by middleware)
  let requestedChanges = req.body.requestedChanges || {};
  if (typeof requestedChanges === 'string') {
    try {
      requestedChanges = JSON.parse(requestedChanges);
    } catch (e) {
      requestedChanges = {};
    }
  }

  // Sanitize remarks: strip tags, trim, and enforce max length
  if (requestedChanges.remarks !== undefined) {
    requestedChanges.remarks = String(requestedChanges.remarks)
      .replace(/<[^>]*>/g, '') // strip HTML/script tags
      .trim()
      .slice(0, 500);           // enforce max length
  }

  // Handle file uploads if they exist
  if (req.files && Object.keys(req.files).length > 0) {
    if (!requestedChanges.documents) {
      requestedChanges.documents = {};
    }
    
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    Object.keys(req.files).forEach((key) => {
      const files = req.files[key];
      if (!files || files.length === 0) return;

      if (key === 'shopPhoto') {
        requestedChanges.documents[key] = files.map(file => ({
          url: `${backendUrl}/uploads/${file.filename}`,
          publicId: file.filename,
          uploadedAt: new Date()
        }));
      } else {
        const file = files[0];
        requestedChanges.documents[key] = {
          url: `${backendUrl}/uploads/${file.filename}`,
          publicId: file.filename,
          uploadedAt: new Date()
        };
      }
    });
  }

  const result = await requestProfileUpdate(memberId, requestedChanges);
  successResponse(res, result, result.message);
};

// Direct Profile Update
const directUpdate = async (req, res) => {
  const memberId = req.member._id;
  
  // Ensure requestedChanges is an object (it should be parsed by middleware)
  let requestedChanges = req.body.requestedChanges || {};
  if (typeof requestedChanges === 'string') {
    try {
      requestedChanges = JSON.parse(requestedChanges);
    } catch (e) {
      requestedChanges = {};
    }
  }

  // Handle file uploads if they exist
  if (req.files && Object.keys(req.files).length > 0) {
    if (!requestedChanges.documents) {
      requestedChanges.documents = {};
    }
    
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    Object.keys(req.files).forEach((key) => {
      const files = req.files[key];
      if (!files || files.length === 0) return;

      if (key === 'shopPhoto') {
        requestedChanges.documents[key] = files.map(file => ({
          url: `${backendUrl}/uploads/${file.filename}`,
          publicId: file.filename,
          uploadedAt: new Date()
        }));
      } else {
        const file = files[0];
        requestedChanges.documents[key] = {
          url: `${backendUrl}/uploads/${file.filename}`,
          publicId: file.filename,
          uploadedAt: new Date()
        };
      }
    });
  }

  const result = await directProfileUpdate(memberId, requestedChanges);
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
const QRCode = require('qrcode');
const User = require('../models/User');

const generateCertificatePDF = async (member, res, preview = false) => {
  const { certificate, establishment, member: memberInfo } = member;

  res.setHeader('Content-Type', 'application/pdf');
  const disposition = preview ? 'inline' : 'attachment';
  res.setHeader('Content-Disposition', `${disposition}; filename="membership_certificate_${member.membershipNumber || 'hub'}.pdf"`);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    layout: 'landscape'
  });

  doc.pipe(res);

  const path = require('path');
  const templatePath = path.join(__dirname, '../public/templates/certificate_bg.png');
  doc.image(templatePath, 0, 0, { width: doc.page.width, height: doc.page.height });

  doc.fillColor('#334155')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text(establishment?.name || establishment?.tradeName || memberInfo?.fullName || 'Registered Establishment', 320, 240);

  doc.fillColor('#475569')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(memberInfo?.address?.city || 'Kerala', 320, 275);

  const certNumber = certificate?.certificateNumber || member.membershipNumber || member._id.toString().substring(0, 4).toUpperCase();
  doc.fillColor('#475569')
     .fontSize(14)
     .font('Helvetica')
     .text(`Membership No: ${certNumber}`, 320, 310);

  let validityYear = '2025 - 2026';
  if (certificate?.expiryDate) {
     const expYear = new Date(certificate.expiryDate).getFullYear();
     validityYear = `${expYear - 1} - ${expYear}`;
  }
  doc.fillColor('#475569')
     .fontSize(14)
     .font('Helvetica')
     .text(`Valid Through ${validityYear}`, 80, 400);

  // Generate QR Code linking to a frontend verification page instead of direct download
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/verify-certificate/${member._id}`;
  
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 1,
    width: 90
  });

  // Position at top right with gap margin
  doc.image(qrBuffer, 700, 40, { width: 90 });

  doc.end();
};

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

    const isPreview = req.query.preview === 'true';
    await generateCertificatePDF(member, res, isPreview);
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating certificate.' });
    }
  }
};

const downloadPublicCertificate = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const member = await User.findById(memberId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (member.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Certificate available only for approved members' });
    }

    // Direct download (attachment)
    await generateCertificatePDF(member, res, false);
  } catch (error) {
    console.error('Error generating public certificate PDF:', error);
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
  directUpdate,
  downloadPublicCertificate,
};
