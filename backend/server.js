const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// ... (Your other imports remain the same)
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

const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- 1. WebSocket & CORS ---

// List your allowed origins here. 
// Once you deploy your Static Site, add that new URL to this array.
const allowedOrigins = [
  'http://localhost:5173', 
  'https://kyusisko-system.onrender.com' // <--- REPLACE THIS WITH YOUR ACTUAL STATIC SITE URL
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow if no origin (tools like Postman) or if it's in our allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// --- 3. Static Files & Routes ---
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/onboarding-orgs', subAdminRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/notif', notifRoutes);
app.use('/api', authRoutes);
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