const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Broadcast title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        targetAudience: {
            type: String,
            enum: ['all', 'active', 'pending'],
            default: 'active',
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Broadcast', broadcastSchema);
