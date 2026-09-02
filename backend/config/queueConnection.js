// config/queueConnection.js
const IORedis = require('ioredis');
require('dotenv').config();

// Explicitly use IPv4 127.0.0.1 to avoid the ::1 ECONNREFUSED error
const redisUrl = process.env.REDIS_URL || 'redis://red-d9b5k6d7vvec73d71o0g:6379';

const redisOptions = {
    maxRetriesPerRequest: null, 
    enableReadyCheck: false
};

console.log(`[Redis] Connecting to: ${redisUrl.replace(/:([^:@]+)@/, ':[PROTECTED]@')}`);

// Create the shared Redis client instance cleanly
const redisClient = new IORedis(redisUrl, redisOptions);

redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redisClient.on('error', (err) => {
    console.error('[Redis Error]', err.message);
});

// Helper for setEx compatibility with recommendationController
redisClient.setEx = async function(key, seconds, value) {
    return this.set(key, value, 'EX', seconds);
};

// Export the active client as the default export, and attach the raw config
module.exports = redisClient;
module.exports.redisConfig = { url: redisUrl, ...redisOptions };