const rateLimit = require('express-rate-limit');

// 1. General rate limiter for all standard API endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Strict rate limiter for sensitive routes (Login, Register, File Uploads)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 requests per windowMs (e.g., stops upload spamming)
    message: {
        error: "Too many attempts. Please slow down and try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, strictLimiter };