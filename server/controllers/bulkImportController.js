const { bulkImportMembers } = require('../services/bulkImportService');
const { successResponse } = require('../utils/responseHelper');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/admin/import-members
 * Body: { members: [...] }   — array of user records
 * Protected: admin only
 */
const importMembersController = async (req, res) => {
  // Accept both { members: [...] } and a raw top-level array
  const members = Array.isArray(req.body) ? req.body : req.body?.members;

  if (!Array.isArray(members) || members.length === 0) {
    throw new ApiError(400, 'Send either { "members": [...] } or a raw JSON array of member records');
  }

  if (members.length > 1000) {
    throw new ApiError(400, 'Maximum 1000 records per import request');
  }

  const result = await bulkImportMembers(members);

  successResponse(res, result, `Import complete: ${result.imported} imported, ${result.skipped} skipped (duplicates), ${result.failed} failed`);
};

module.exports = { importMembersController };
