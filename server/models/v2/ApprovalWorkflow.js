const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipApplication',
      required: true,
      unique: true,
    },
    approvals: [
      {
        role: {
          type: String,
          enum: ['president', 'secretary', 'treasurer'],
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserV2',
        },
        updatedAt: Date,
        remarks: String,
      }
    ],
    finalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApprovalWorkflow', workflowSchema);
