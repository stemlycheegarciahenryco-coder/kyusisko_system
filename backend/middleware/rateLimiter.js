const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    // 🔥 Switch from in-memory tracking to Redis tracking
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: { error: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});