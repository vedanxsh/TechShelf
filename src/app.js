const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const authController = require('./controllers/authController');

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static Web Assets
app.use(express.static(config.paths.publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Backward compatibility endpoints for existing clients/scripts
app.post('/api/login', authController.login);
app.post('/api/register', authController.register);

// Health Check Endpoint (useful for Docker, Render, Kubernetes, etc.)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    app: config.appName,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(config.paths.publicDir, 'index.html'));
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
