const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: {
        type: String,
        description: "Set after successful payment verification"
    },
    razorpaySignature: {
        type: String
    },
    amount: {
        total: { type: Number, required: true },
        base: { type: Number, required: true },
        gst: { type: Number, required: true },
        currency: { type: String, default: 'INR' }
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed', 'refunded', 'cancelled'],
        default: 'created'
    },
    orderType: {
        type: String,
        enum: ['membership_new', 'membership_renewal', 'event_booking'],
        required: true
    },
    paymentDetails: {
        captured: { type: Boolean, default: false },
        method: { type: String },
        bank: { type: String },
        wallet: { type: String },
        vpa: { type: String }, // UPI ID
        error_description: { type: String }
    },
    metadata: {
        type: Map,
        of: String
    },
    history: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        description: String
    }]
}, { 
    timestamps: true 
});

// Indexing for faster lookups
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ member: 1 });

module.exports = mongoose.model('Order', OrderSchema);
