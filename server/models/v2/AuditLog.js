const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserV2',
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'APPLICATION_APPROVED', 'MEMBER_BLOCKED'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // ID of the member, application, or event affected
    },
    targetType: {
      type: String,
      enum: ['User', 'MembershipApplication', 'Event'],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Storing before/after changes
    },
    ipAddress: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
