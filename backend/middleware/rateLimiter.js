const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;

// Import your existing ioredis client
const redisClient = require('../config/queueConnection');

// Helper to clean up the store creation and enforce unique prefixes
const createRedisStore = (prefixName) => {
    return new RedisStore({
        // ioredis uses .call(...args) instead of .sendCommand(args)
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefixName}:`
    });
};

// ----------------------------------------------------
// 1. LOGIN LIMITER
// ----------------------------------------------------
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 2000 : 500, 
    store: createRedisStore('auth'), 
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ----------------------------------------------------
// 2. GENERAL API LIMITER
// ----------------------------------------------------
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 2000 : 100,
    store: createRedisStore('general'),
    message: { error: "High traffic detected. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ----------------------------------------------------
// 3. OTP SEND LIMITER (Prevents Email/SMS Spam)
// ----------------------------------------------------
const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 1000 : 3, 
    keyGenerator: (req, res) => {
        if (req.body && req.body.email) {
            return req.body.email.toLowerCase(); // Rate limit by email first
        }
        return ipKeyGenerator(req, res); // Fallback to safely formatted IP
    },
    store: createRedisStore('otp_send'),
    message: { error: "Too many OTP requests. Please wait 15 minutes before requesting another code." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ----------------------------------------------------
// 4. OTP VERIFY LIMITER (Prevents Brute-Forcing 6-Digit Codes)
// ----------------------------------------------------
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 1000 : 5, 
    store: createRedisStore('otp_verify'),
    message: { error: "Too many verification attempts. Please wait 15 minutes or request a new code." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ----------------------------------------------------
// 5. REGISTRATION LIMITER (Prevents Mass Bot Accounts)
// ----------------------------------------------------
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 1000 : 5, 
    store: createRedisStore('registration'),
    message: { error: "Too many registration attempts from this network. Please try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    generalLimiter,
    otpSendLimiter,
    otpVerifyLimiter,
    registrationLimiter
};