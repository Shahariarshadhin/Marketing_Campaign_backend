const express = require('express');
const router = express.Router();
const authController = require('../controllers/Authcontroller');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');

// One-time admin setup (only works if no admin exists)
router.post('/setup-admin', authController.setupAdmin);

// Login
router.post('/login', authController.login);

// Get current user
router.get('/me', protect, authController.getMe);

// Register new user (admin only)
router.post('/register', protect, adminOnly, authController.register);

module.exports = router;