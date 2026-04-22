const express = require('express');
const cors = require('cors');
const subAdminRoutes = require('./routes/subAdminRoutes'); // 1. Import it
const authRoutes = require('./routes/authRoutes'); // 2. Import auth routes
const RegStudentRoutes = require('./routes/RegStudentRoutes');
const scholarshipRoutes = require('./routes/ScholarShipRoutes');           // ← add
const scholarshipFieldRoutes = require('./routes/createFieldScholarship'); // ← add
const applicationRoutes = require('./routes/applicationRoutes'); 
const recommendationRoutes = require('./routes/recommendationRoutes'); // ← add
const securityRoutes = require('./routes/securityRoutes'); // ← add
const orgRoutes = require('./routes/orgRoutes'); // ← add
const superRoutes = require('./routes/superRoutes'); // ← add
const renewRoutes = require('./routes/renewRoutes');
const http = require('http');

const {Server} = require('socket.io');
require('dotenv').config();

const app = express();
const path = require('path');
//websocket realtime
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const uploadsPath = path.resolve(__dirname, 'uploads');

app.use(cors());
app.use(express.json())


//student NOT STRUCTURED PLEASE COMEBACK!!!!
app.get('/test', (req, res) => res.send("Server is reaching this point!"));
app.use('/uploads', express.static(uploadsPath)); // serve uploaded files statically

app.use('/api/onboarding', subAdminRoutes);; // endpoint creating a subadmin
app.use('/api/recommendations', recommendationRoutes); // ← add this line to include recommendation routes
app.use('/api/orgs', orgRoutes);
app.use('/api/security', securityRoutes);

app.use('/api/super', superRoutes);
app.use('/api/renew', renewRoutes);
app.use('/api', RegStudentRoutes);
app.use('/api', authRoutes); // This makes the URL /Sapi/auth/login
// scholarship routes
app.use('/api', scholarshipRoutes);        // /api/scholarship
app.use('/api', scholarshipFieldRoutes);   // /api/scholarship/:id/fields
app.use('/api', applicationRoutes);        // /api/scholarship/:id/apply



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));