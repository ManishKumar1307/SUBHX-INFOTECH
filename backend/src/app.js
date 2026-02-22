const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

// Try to load middleware with fallbacks
let ipWhitelistMiddleware, errorHandler;
try {
  ipWhitelistMiddleware = require('./middleware/ipWhitelist').ipWhitelistMiddleware;
} catch (error) {
  console.warn('IP whitelist middleware not loaded:', error.message);
  ipWhitelistMiddleware = (req, res, next) => next();
}

try {
  errorHandler = require('./middleware/errorHandler').errorHandler;
} catch (error) {
  console.warn('Error handler not loaded:', error.message);
  errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  };
}

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser()); 

// Request logging (simple console version)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// IP Whitelist middleware
app.use(ipWhitelistMiddleware);

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;