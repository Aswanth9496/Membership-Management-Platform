const express = require('express');
const router = express.Router();
const {
    getPublishedEventsController,
    getPublishedEventDetailsController,
    registerForEventController,
    verifyEventRegistrationController,
    getMyEventsController
} = require('../controllers/memberEventController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateMember } = require('../middlewares/authMiddleware');

/**
 * Member Routes - Event Registration
 */

// Get all published events
router.get('/', authenticateMember, asyncHandler(getPublishedEventsController));

// Get member's registered events
router.get('/my-events', authenticateMember, asyncHandler(getMyEventsController));

// Verify registration payment
router.post('/verify-payment', authenticateMember, asyncHandler(verifyEventRegistrationController));

// Get single published event details
router.get('/:eventId', authenticateMember, asyncHandler(getPublishedEventDetailsController));

// Register for an event (Initiate)
router.post('/register/:eventId', authenticateMember, asyncHandler(registerForEventController));

module.exports = router;
