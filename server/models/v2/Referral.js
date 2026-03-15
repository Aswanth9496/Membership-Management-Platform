const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipApplication',
      required: true,
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserV2', // The existing member who referred
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    verifiedAt: Date,
    remarks: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReferralV2', referralSchema);
