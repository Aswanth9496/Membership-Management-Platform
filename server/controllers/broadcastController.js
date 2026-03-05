const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const { successResponse } = require('../utils/responseHelper');
const ApiError = require('../utils/ApiError');

/**
 * Broadcast message to all active users
 * POST /api/admin/broadcast
 @param {string} req.body.title - Broadcast title
 @param {string} req.body.message - Message content
 @param {string} req.body.target - Audience target ('active','all')
 */
const sendBroadcastController = async (req, res) => {
    const { title, message, target = 'active' } = req.body;
    const adminId = req.admin.id;

    if (!title || !message) {
        throw new ApiError(400, 'Title and message are required');
    }

    // Create broadcast record
    const broadcast = await Broadcast.create({
        title,
        message,
        sender: adminId,
        targetAudience: target,
    });

    // Fetch target users
    const filter = target === 'all' ? {} : { status: 'active' };
    const targetUsers = await User.find(filter).select('_id email member.fullName');

    console.log(`📢 Broadcasting message to ${targetUsers.length} users...`);

    // Note: Integrate with email/notification service here if needed.
    // We'll return the broadcast object.

    successResponse(
        res,
        {
            broadcast: {
                id: broadcast._id,
                title: broadcast.title,
                message: broadcast.message,
                target: broadcast.targetAudience,
                sentAt: broadcast.sentAt,
            },
            sentToCount: targetUsers.length,
        },
        'Message broadcasted successfully'
    );
};

/**
 * Get all broadcast history
 * GET /api/admin/broadcast
 */
const getBroadcastHistoryController = async (req, res) => {
    const broadcasts = await Broadcast.find()
        .populate('sender', 'fullName role')
        .sort({ createdAt: -1 });

    successResponse(
        res,
        { broadcasts },
        'Broadcast history retrieved successfully'
    );
};

module.exports = {
    sendBroadcastController,
    getBroadcastHistoryController,
};
