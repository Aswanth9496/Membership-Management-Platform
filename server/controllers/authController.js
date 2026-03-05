const { successResponse } = require('../utils/responseHelper');
const { formatAdminResponse } = require('../services/adminService');

// Get current user (either Admin or Member)
const getMe = async (req, res) => {
    if (req.admin) {
        const adminData = formatAdminResponse(req.admin);
        return successResponse(res, { user: adminData }, 'Admin profile retrieved');
    }

    if (req.member) {
        // Standardize member response to match what the frontend expects { user: { id, name, email, role } }
        const member = req.member;
        const userData = {
            id: member._id,
            name: member.member?.fullName || member.name || 'Member User',
            email: member.email,
            role: member.role || 'member',
            status: member.status,
            isActive: member.isActive
        };
        return successResponse(res, { user: userData }, 'Member profile retrieved');
    }

    // Should technically not reach here if authenticateAny works correctly
    res.status(401).json({ success: false, message: 'Not authenticated' });
};

module.exports = {
    getMe
};
