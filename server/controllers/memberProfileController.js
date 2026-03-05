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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="membership_certificate_${member.membershipNumber || 'hub'}.pdf"`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      layout: 'landscape'
    });

    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8FAFC');

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#2563EB').lineWidth(4).stroke();
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).strokeColor('#94A3B8').lineWidth(1).stroke();

    doc.fillColor('#0F172A').fontSize(42).font('Helvetica-Bold').text('Membership Certificate', 0, 100, {
      align: 'center'
    });

    doc.fillColor('#64748B').fontSize(16).font('Helvetica').text('Recognized Platform Vendor Authority', 0, 155, {
      align: 'center'
    });

    doc.moveDown(3);
    doc.fillColor('#334155').fontSize(18).text('This certifies that', { align: 'center' });

    doc.moveDown(1);
    doc.fillColor('#1E3A8A').fontSize(36).font('Helvetica-Bold').text(establishment?.name || establishment?.tradeName || 'Registered Establishment', { align: 'center' });

    doc.moveDown(1);
    doc.fillColor('#334155').fontSize(18).font('Helvetica').text('Owned by', { align: 'center' });

    doc.moveDown(0.5);
    doc.fillColor('#0F172A').fontSize(24).font('Helvetica-Bold').text(memberInfo?.fullName || 'Distinguished Member', { align: 'center' });

    doc.moveDown(2);
    doc.fillColor('#475569').fontSize(14).font('Helvetica').text('Is a fully approved and verified member in active standing.', { align: 'center' });

    const issueDate = certificate?.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : new Date().toLocaleDateString();
    const expiryDate = certificate?.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'Active';
    const certNumber = certificate?.certificateNumber || member.membershipNumber || member._id.toString().substring(0, 8).toUpperCase();

    const bottomY = doc.page.height - 120;

    doc.fontSize(12).fillColor('#64748B');
    doc.text('Date of Issue', 100, bottomY);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(issueDate, 100, bottomY + 20);

    doc.fillColor('#64748B').font('Helvetica').text('Certificate No.', doc.page.width / 2 - 40, bottomY);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(certNumber, doc.page.width / 2 - 40, bottomY + 20);

    doc.fillColor('#64748B').font('Helvetica').text('Valid Until', doc.page.width - 200, bottomY);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(expiryDate, doc.page.width - 200, bottomY + 20);

    doc.end();

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating certificate.' });
    }
  }
};

module.exports = {
  requestUpdate,
  getStatus,
  cancelRequest,
  downloadCertificate,
};
