const AuditLog = require('../../models/v2/AuditLog');

const logAction = async ({ actorId, action, targetId, targetType, details, req }) => {
  try {
    const log = new AuditLog({
      actorId,
      action,
      targetId,
      targetType,
      details,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || '0.0.0.0',
    });
    await log.save();
  } catch (err) {
    console.error('Audit Log failed:', err);
  }
};

module.exports = {
  logAction,
};
