const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const connectDB = require('./db');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in dev to avoid blocking Vite
}));
app.use(cors()); // Cross-Origin Resource Sharing

// Rate Limiting (Prevent Brute Force) - Increased for high usage scenarios
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json());

// Serve static files (React App)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const logRoutes = require('./routes/logs');
const requestsRouter = require('./routes/requests');
const contactRoutes = require('./routes/contact');
const guardRoutes = require('./routes/guards');
const visitorGroupRoutes = require('./routes/visitorGroups');
const manifestRoutes = require('./routes/manifest');
const deliveriesRoutes = require('./routes/deliveries');
const visitsRoutes = require('./routes/visits');
const attendanceRoutes = require('./routes/attendance');
const preRegistrationsRoutes = require('./routes/preRegistrations');
const evacuationRoutes = require('./routes/evacuation');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/requests', requestsRouter);
app.use('/api/contact', contactRoutes);
app.use('/api/guards', guardRoutes);
app.use('/api/visitor-groups', visitorGroupRoutes);
app.use('/api/manifest', manifestRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/pre-registrations', preRegistrationsRoutes);
app.use('/api/evacuation', evacuationRoutes);
app.use('/api/posters', require('./routes/posters'));

// Health check — always responds regardless of DB state
app.get('/api/health', (req, res) => {
  const dbState = require('mongoose').connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db: states[dbState] || 'unknown',
    mongo_uri_set: !!process.env.MONGO_URI,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Catch-all handler for React SPA (must be last)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Broadcast Socket.io to routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Admin disconnected');
  });
});

const manifestCache = require('./services/manifestCache');
const Site = require('./models/Site');

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    const sites = await Site.find().lean();
    for (const s of sites) {
      await manifestCache.seedFromDB(s.code);
    }
  } catch (err) {
    console.error('Failed to seed manifest cache:', err);
  }
});
