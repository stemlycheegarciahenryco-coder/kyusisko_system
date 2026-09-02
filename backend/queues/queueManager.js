// queues/queueManager.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { redisConfig } = require('../config/queueConnection');

const queueConnection = new IORedis(redisConfig.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

const queues = {
    notifications: new Queue('notificationsQueue', { connection: queueConnection }),
    emails: new Queue('emailQueue', { connection: queueConnection }),
    files: new Queue('fileProcessingQueue', { connection: queueConnection }),
    // 🔴 ADD THIS: Dedicated AI background processing queue
    engineMatching: new Queue('engineMatching', { connection: queueConnection })
};

const addJob = async (queueName, jobName, data) => {
    if (!queues[queueName]) {
        throw new Error(`Queue cluster '${queueName}' does not exist.`);
    }
    await queues[queueName].add(jobName, data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: { count: 100 }
    });
};

module.exports = { addJob };