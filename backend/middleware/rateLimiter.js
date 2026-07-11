const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

//this is for log in limiter 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 2000 : 100, // 1000 attempts in dev, 5 in production!
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 2000 : 100, // Safe buffer for dashboard widgets
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: { error: "High traffic detected. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {authLimiter, generalLimiter};