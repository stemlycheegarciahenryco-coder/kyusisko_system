// workers/notificationWorker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const db = require('../config/db'); // Your PostgreSQL pool instance
const { redisConfig } = require('../config/queueConnection');

const connection = new IORedis(redisConfig.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

const notificationWorker = new Worker('notificationsQueue', async (job) => {
    console.log(`Processing Job ${job.id}: ${job.name}`);
    
    if (job.name === 'sendRenewalNotif') {
        const { studentId, title, message, applicationId } = job.data;
        
        // Heavy database network write happens here, safely outside Express HTTP stream
        await db.query(
            `INSERT INTO notifications (student_id, title, message, application_id, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [studentId, title, message, applicationId]
        );
    }
    
    if (job.name === 'sendBulkBroadcast') {
        // You can scale this out to process multiple things easily later
    }
}, { 
    connection,
    concurrency: 5 // Process up to 5 jobs simultaneously per thread instance
});

notificationWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
});

module.exports = notificationWorker;