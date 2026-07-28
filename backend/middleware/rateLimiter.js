const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit'); // <-- Added this helper
const RedisStore = require('rate-limit-redis').default;
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// ----------------------------------------------------
// 1. LOGIN LIMITER
// ----------------------------------------------------
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 2000 : 500, 
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
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
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
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
    // THE FIX IS HERE:
    keyGenerator: (req, res) => {
        if (req.body && req.body.email) {
            return req.body.email.toLowerCase(); // Rate limit by email first
        }
        return ipKeyGenerator(req, res); // Fallback to safely formatted IP
    },
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
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
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
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
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
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