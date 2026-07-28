const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const path = require('path');
require('dotenv').config();

// 🚀 1. BOOT UP THE BULLMQ BACKGROUND WORKER PROCESS
// This wakes up your worker file so it listens to Redis queue jobs cleanly in the background
require('./queues/applicationQueue');
require('./workers/engineMatchingWorker'); // <-- Dedicated AI background processing queue

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
const userOrgRoutes = require('./routes/userOrgRoutes');
const searchRoutes = require('./routes/searchRoutes');
const lookupRouter = require('./routes/lookup');
const systemAdminRouter = require('./routes/systemadmin');

const commentRoutes = require('./routes/commentRoutes');

const app = express();

app.set('trust proxy', 1);

// --- 2. CORS & Express Middleware Configuration ---

const allowedOrigins = [
  'http://localhost:5173',
  'https://kyusisko.com',
  'https://www.kyusisko.com',
  'https://kyusisko-system.onrender.com'
];

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
app.use('/api',  authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/user-org', userOrgRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/renewals', renewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/system-admin', systemAdminRouter);
app.use('/api/search', searchRoutes);
app.use('/api/lookup', lookupRouter);
app.use('/api', RegStudentRoutes);


app.get('/test', (req, res) => res.send("Server is reaching this point!"));

// --- 4. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running smoothly on port ${PORT}`));