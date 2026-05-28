require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const locationRoutes = require('./routes/locationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup security headers (disable Content Security Policy to allow tester UI inline scripts)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Setup CORS middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS;
if (allowedOrigins && allowedOrigins !== '*') {
  const originsList = allowedOrigins.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (originsList.indexOf(origin) !== -1) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    })
  );
} else {
  app.use(cors()); // Allow all origins for public access / demo
}

// Request parsers
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '16kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static tester UI files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/location-insights', locationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'landmark-api' });
});

// Meta endpoints description
app.get('/meta', (req, res) => {
  res.status(200).json({
    service: 'landmark-api',
    description: 'Bengaluru Location Insights API',
    endpoints: [
      {
        method: 'GET',
        path: '/location-insights',
        query_params: {
          location: 'Place name query (string)',
          latlon: 'Target coordinates as "latitude,longitude" (string)',
        },
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Liveness checking endpoint',
      },
      {
        method: 'GET',
        path: '/meta',
        description: 'Service metadata',
      },
    ],
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found. Check path and request method.',
    code: 'NOT_FOUND',
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler caught:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  const code = err.code || 'INTERNAL';

  res.status(statusCode).json({
    error: message,
    code: code,
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
