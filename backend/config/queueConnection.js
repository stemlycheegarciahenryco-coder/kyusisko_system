// config/queueConnection.js
const IORedis = require('ioredis');
require('dotenv').config();

const redisConfig = {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    maxRetriesPerRequest: null, 
    enableReadyCheck: false
};

// Create the shared Redis client instance
const redisClient = new IORedis(redisConfig.url, redisConfig);

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
module.exports.redisConfig = redisConfig;