const Event = require('../models/Event');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { createOrder, verifyPaymentSignature, getRazorpayKeyId } = require('../utils/razorpayHelper');
// Helper for order numbers is handled inline or via local logic

/**
 * Register a member for an event
 * @param {string} eventId - ID of the event
 * @param {string} memberId - ID of the member
 * @param {Object} memberInfo - Additional member info (optional)
 * @returns {Promise<Object>} - Registration result or payment order
 */
const registerForEvent = async (eventId, memberId, memberInfo = {}) => {
    try {
        // 1. Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            throw new ApiError(404, 'Event not found');
        }

        // 2. Check strict membership rules for event registration
        const member = await User.findById(memberId);

        if (!member) {
            throw new ApiError(404, 'Member not found');
        }

        const isApproved = member.status === 'approved';
        const hasPaid = member.certificate && member.certificate.generated;
        const expiryDate = member.certificate?.expiryDate ? new Date(member.certificate.expiryDate) : null;
        const isNotExpired = expiryDate && expiryDate >= new Date();

        if (!isApproved || !hasPaid || !isNotExpired) {
            throw new ApiError(403, 'Your membership is not active. Please complete membership payment to register for events.');
        }

        // 3. Validate event status and registration window
        if (event.status !== 'published') {
            throw new ApiError(400, 'This event is not yet open for registration');
        }

        if (!event.registration.isOpen) {
            throw new ApiError(400, 'Registration for this event is closed');
        }

        const now = new Date();
        if (now > event.registration.deadline) {
            throw new ApiError(400, 'Registration deadline has passed');
        }

        // 3. Check capacity
        if (event.registration.currentCount >= event.registration.maxCapacity) {
            throw new ApiError(400, 'Event has reached its maximum capacity');
        }

        // 4. Check if member is already registered accurately
        const existingRegistrationIndex = event.registrations.findIndex(
            (reg) => reg.member.toString() === memberId.toString()
        );

        if (existingRegistrationIndex !== -1) {
            const existingReg = event.registrations[existingRegistrationIndex];
            
            // If already completed, officially registered.
            if (existingReg.payment.status === 'completed') {
                throw new ApiError(400, 'You are already registered for this event');
            }
            
            // If pending or failed, we allow a retry by removing the old stale attempt
            console.log(`♻️  Retrying registration for member ${memberId}. Removing old ${existingReg.payment.status} attempt.`);
            event.registrations.splice(existingRegistrationIndex, 1);
            // Note: We don't save yet, we save after pushing the new one below
        }

        // 5. Handle Free Event vs Paid Event
        if (!event.isPaid) {
            // FREE EVENT REGISTRATION
            event.registrations.push({
                member: memberId,
                registeredAt: new Date(),
                payment: {
                    status: 'completed',
                    amount: 0,
                    paymentMethod: 'other', // Or 'none'
                    paidAt: new Date(),
                },
            });

            event.registration.currentCount += 1;
            await event.save();

            console.log(`✅ Member ${memberId} registered for Free Event: ${event.title}`);

            return {
                success: true,
                isPaid: false,
                message: 'Registration successful!',
                event: {
                    id: event._id,
                    title: event.title,
                },
            };
        } else {
            // PAID EVENT REGISTRATION - Initiate Payment Flow
            
            // 1. Calculate tax breakdown (Production Standard)
            const baseAmount = Math.round(event.price / 1.18);
            const gstAmount = event.price - baseAmount;

            // 2. Create Razorpay order
            const receipt = `EVT_${Date.now().toString().slice(-9)}_${Math.floor(Math.random() * 1000)}`;
            const notes = {
                eventId: eventId.toString(),
                memberId: memberId.toString(),
                eventTitle: event.title,
                type: 'event_booking'
            };

            const rzpOrder = await createOrder(event.price, receipt, notes);

            // 3. Create Internal PRODUCTION-STANDARD Order
            const orderNumber = `ORD-EVT-${Date.now()}`;
            const internalOrder = await Order.create({
                orderNumber,
                member: memberId,
                razorpayOrderId: rzpOrder.id,
                amount: {
                    total: event.price,
                    base: baseAmount,
                    gst: gstAmount
                },
                orderType: 'event_booking',
                metadata: {
                    eventId: eventId.toString(),
                    eventTitle: event.title
                },
                history: [{
                    status: 'created',
                    description: `Event registration initiated for: ${event.title}`
                }]
            });

            // 4. Create Legacy Payment Record
            await Payment.create({
                user: memberId,
                razorpayOrderId: rzpOrder.id,
                amount: event.price,
                status: 'pending',
                paymentType: 'event_registration'
            });

            // 5. Add pending registration entry to Event model
            event.registrations.push({
                member: memberId,
                payment: {
                    status: 'pending',
                    amount: event.price,
                    transactionId: rzpOrder.id,
                },
            });

            await event.save();

            console.log(`💳 Order created for Event: ${event.title} (ID: ${internalOrder.orderNumber})`);

            const member = await User.findById(memberId);

            return {
                success: true,
                isPaid: true,
                message: 'Payment required to complete registration',
                razorpayKeyId: getRazorpayKeyId(),
                order: {
                    id: rzpOrder.id,
                    amount: event.price * 100, // Razorpay expects paise
                    currency: 'INR',
                },
                memberDetails: {
                    name: member.member?.fullName || '',
                    email: member.email,
                    contact: member.member?.mobile || '',
                },
                event: {
                    id: event._id,
                    title: event.title,
                },
            };
        }
    } catch (error) {
        console.error('Error in registerForEvent:', error);
        throw error;
    }
};

/**
 * Verify event registration payment
 * @param {string} razorpayOrderId 
 * @param {string} razorpayPaymentId 
 * @param {string} razorpaySignature 
 */
const verifyRegistrationPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
        // 1. Find event containing this order ID
        const event = await Event.findOne({ 'registrations.payment.transactionId': razorpayOrderId });
        if (!event) {
            throw new ApiError(404, 'Event registration record not found on the event entity');
        }

        // 2. Find specific registration entry
        const registration = event.registrations.find(
            (reg) => reg.payment.transactionId === razorpayOrderId
        );

        if (!registration) {
            throw new ApiError(400, 'Registration detail not found in event list');
        }

        if (registration.payment.status === 'completed') {
            return { success: true, alreadyProcessed: true };
        }

        // 3. Update registration details
        registration.payment.status = 'completed';
        registration.payment.transactionId = razorpayPaymentId;
        registration.payment.paidAt = new Date();
        registration.registeredAt = new Date();

        // 4. Increment event capacity count
        event.registration.currentCount += 1;

        // 5. Save event
        await event.save();

        console.log(`✅ Event registration confirmed for: ${event.title}`);

        return {
            success: true,
            message: 'Registration confirmed!',
            event: {
                id: event._id,
                title: event.title,
            }
        };
    } catch (error) {
        console.error('Error confirming event registration:', error);
        throw error;
    }
};

/**
 * Get all events a member is registered for
 * @param {string} memberId 
 * @returns {Promise<Array>}
 */
const getMyRegisteredEvents = async (memberId) => {
    try {
        const events = await Event.find({
            'registrations.member': memberId,
            'registrations.payment.status': 'completed',
            isActive: true
        })
            .select('title eventType eventDate venue registration status registrations isPaid price')
            .lean();

        // Transform and return only the relevant registration info for the member
        return events.map(event => {
            const myRegistration = event.registrations.find(
                reg => reg.member.toString() === memberId.toString()
            );

            return {
                ...event,
                _id: event._id, // Ensure _id is present
                registrationDetails: {
                    registeredAt: myRegistration.registeredAt,
                    paymentStatus: myRegistration.payment.status,
                    amount: myRegistration.payment.amount,
                    confirmationNumber: myRegistration.confirmationNumber
                }
            };
        });
    } catch (error) {
        console.error('Error in getMyRegisteredEvents:', error);
        throw error;
    }
};

module.exports = {
    registerForEvent,
    verifyRegistrationPayment,
    getMyRegisteredEvents,
};
