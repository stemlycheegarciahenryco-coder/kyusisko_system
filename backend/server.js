const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); //
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
// Keep this configuration for local development and safety
const allowedOrigins = [
  'http://localhost:5173', // Needed for local dev
  process.env.RENDER_EXTERNAL_URL // Automatically uses your Render URL if provided
].filter(Boolean); // Removes null/undefined values

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


app.use(cookieParser()); // REQUIRED: Allows Express to read req.cookies
app.use(express.json());

// --- 3. Static Files & Routes ---
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/onboarding-orgs', subAdminRoutes);       // Matches /api/onboarding-orgs/profile
app.use('/api/organizations', orgRoutes);         // Matches /api/organizations/profile/:id
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/notif', notifRoutes);               // Matches /api/notif/mark-read
// Keep these only if the routes inside them don't have their own prefixes
app.use('/api', authRoutes);                 // Example: if routes are /login, /register
app.use('/api/scholarships', scholarshipRoutes);  // Matches /api/scholarships/...
app.use('/api/applications', applicationRoutes);
app.use('/api/renewals', renewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/system-admin', systemAdminRouter);
app.use('/api/search', searchRoutes);
app.use('/api/lookup', lookupRouter);
app.use('/api', RegStudentRoutes);
app.get('/test', (req, res) => res.send("Server is reaching this point!"));


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}
// --- 4. Start Server ---
const PORT = process.env.PORT || 5000;
// CRITICAL: Use server.listen, not app.listen, or Socket.io won't work!
server.listen(PORT, () => console.log(`🚀 Server & WebSocket running on port ${PORT}`));