const express = require('express');
const router = express.Router();
const securityController = require('../controller/securityController');
const { otpSendLimiter } = require('../middleware/rateLimiter');
// const { protectStudent } = require('../middleware/authMiddleware'); // If you have auth middleware

// This is the route your React frontend calls when the student enters the 6-digit code
router.post('/verify-otp', securityController.verifyOTP);

// FIX: This route didn't exist at all, so every "Resend Code" click from
// OTPVerification.jsx was 404ing. Now wired to the new resendOTP handler,
// and rate-limited (2 sends per 15 min) so repeated clicks can't be used
// to spam a student's inbox or brute-force cheap OTP generation.
router.post('/resend-otp', otpSendLimiter, securityController.resendOTP);

// Optional: Add a route to update settings (called from your StudentSettings.jsx)
// router.put('/settings/2fa', protectStudent, securityController.update2FASettings);

module.exports = router;