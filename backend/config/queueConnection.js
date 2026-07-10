// config/queueConnection.js
const IORedis = require('ioredis');
require('dotenv').config();

const redisConfig = {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    // Maximize throughput and stability over the network
    maxRetriesPerRequest: null, 
    enableReadyCheck: false
};

// Return the shared configuration object
module.exports = redisConfig;