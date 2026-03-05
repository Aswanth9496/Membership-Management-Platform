const express = require('express');
const router = express.Router();
const { getMe } = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticateAny } = require('../middlewares/authMiddleware');

// Get generic profile info (app initialization step)
router.get('/me', authenticateAny, asyncHandler(getMe));

module.exports = router;
