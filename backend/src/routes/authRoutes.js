const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validation');

// Public routes with rate limiting
router.post('/register', authRateLimiter, registerValidation, authController.register);
router.post('/login', authRateLimiter, loginValidation, authController.login);
router.post('/refresh-token', authRateLimiter, authController.refreshToken);

// Protected routes
router.get('/me', authenticateToken, authController.getUser);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;