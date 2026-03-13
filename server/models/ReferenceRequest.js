const mongoose = require('mongoose');

const referenceRequestSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referencedMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    remarks: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests for the same applicant-reference pair
referenceRequestSchema.index({ applicantId: 1, referencedMemberId: 1 }, { unique: true });

module.exports = mongoose.model('ReferenceRequest', referenceRequestSchema);
