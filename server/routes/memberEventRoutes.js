const express = require('express');
const router = express.Router();
const {
    getPublishedEventsController,
    getPublishedEventDetailsController,
    registerForEventController,
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

// Get single published event details
router.get('/:eventId', authenticateMember, asyncHandler(getPublishedEventDetailsController));

// Register for an event (Initiate)
router.post('/register/:eventId', authenticateMember, asyncHandler(registerForEventController));

module.exports = router;
