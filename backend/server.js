const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authLimiter, generalLimiter } = require('./middleware/rateLimiter');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const socketManager = require('./config/socketManager');
require('dotenv').config();

// 🚀 1. BOOT UP THE BULLMQ BACKGROUND WORKER PROCESS
// This wakes up your worker file so it listens to Redis queue jobs and fires socket events
require('./queues/applicationQueue');

// Initialize Redis Pub/Sub Clients
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

// Route Imports
const subAdminRoutes = require('./routes/subAdminRoutes');
const authRoutes = require('./routes/authRoutes');
const RegStudentRoutes = require('./routes/RegStudentRoutes');
const scholarshipRoutes = require('./routes/ScholarShipRoutes');
const scholarshipFieldRoutes = require('./routes/createFieldScholarship');
const applicationRoutes = require('./routes/applicationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const securityRoutes = require('./routes/securityRoutes');
const orgRoutes = require('./routes/orgRoutes');
const notifRoutes = require('./routes/notifRoutes');
const renewRoutes = require('./routes/renewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const searchRoutes = require('./routes/searchRoutes');
const lookupRouter = require('./routes/lookup');
const systemAdminRouter = require('./routes/systemadmin');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// --- 2. WebSocket & CORS Initialization ---

const allowedOrigins = [
  'http://localhost:5173',
  'https://kyusisko.com',
  'https://www.kyusisko.com',
  'https://kyusisko-system.onrender.com'
];

// Initialize Socket.io instance FIRST so it exists when Redis connects
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

// Attach the Redis Adapter safely now that `io` is initialized
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("↔️ Redis Socket.io Adapter connected successfully");
}).catch(err => {
    console.error("❌ Redis Adapter Connection Failed:", err);
});

// Initialize the socket manager singleton with the verified io instance
socketManager.init(io);

// Express Middleware Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// --- 3. Static Files & Routes ---
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/onboarding-orgs', subAdminRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/recommendations',  recommendationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/notif',  notifRoutes);
app.use('/api', authLimiter, authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/renewals', renewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/system-admin', systemAdminRouter);
app.use('/api/search', searchRoutes);
app.use('/api/lookup', lookupRouter);
app.use('/api', RegStudentRoutes);

app.get('/test', (req, res) => res.send("Server is reaching this point!"));

// --- 4. Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server & WebSocket running on port ${PORT}`));