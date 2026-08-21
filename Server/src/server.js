// Server entry point - LeetPulse API Engine
const express = require('express');
const http = require('http');

const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { startSyncScheduler } = require('./services/syncEngine');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leetcodeRoutes = require('./routes/leetcodeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const devadminRoutes = require('./routes/devadminRoutes');
const goalRoutes = require('./routes/goalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const weeklyProblemRoutes = require('./routes/weeklyProblemRoutes');

const institutionRoutes = require('./routes/institutionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, '')] : '*';
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/devadmin', devadminRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/weekly-problems', weeklyProblemRoutes);

app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/reports', reportRoutes);


// Base API welcome & Health check endpoints
app.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'LEETPULSE API Engine',
    version: '1.0.0',
    status: 'ONLINE',
    message: 'LeetCode Monitoring & Analytics Platform Backend Service is Running',
    health: '/api/health',
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LeetCode Monitoring Engine Active', timestamp: new Date() });
});



const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] LeetCode Monitoring Engine listening on port ${PORT}`);
    // Start background sync scheduler
    startSyncScheduler();
  });
}).catch(err => {
  console.error('[Server] Failed to connect DB:', err);
});
