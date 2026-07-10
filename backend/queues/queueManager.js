// queues/queueManager.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const redisConfig = { ...require('../config/queueConnection'), maxRetriesPerRequest: null };

// Reusable connections specific to queue producers
const queueConnection = new IORedis(redisConfig.url, redisConfig);

// Define all your global background queues here
const queues = {
    notifications: new Queue('notificationsQueue', { connection: queueConnection }),
    emails: new Queue('emailQueue', { connection: queueConnection }),
    files: new Queue('fileProcessingQueue', { connection: queueConnection })
};

/**
 * Global helper function to push tasks into background queues
 * @param {string} queueName - Name of the target queue ('notifications', 'emails', 'files')
 * @param {string} jobName - Descriptive name of the specific task
 * @param {object} data - The payload/arguments needed for the task
 */
const addJob = async (queueName, jobName, data) => {
    if (!queues[queueName]) {
        throw new Error(`Queue cluster '${queueName}' does not exist.`);
    }
    // backoff adds network resilience: retry 3 times, delayed by 2 seconds if network flickers
    await queues[queueName].add(jobName, data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true, // Auto-clean Redis memory on success
        removeOnFail: { count: 100 } // Keep last 100 failures for debugging
    });
};

module.exports = { addJob };