/**
 * PHASE 6: Enhanced Express App Configuration
 * Features: Middleware registration, global error handling, monitoring
 * Date: December 4, 2025
 * Status: Production-Ready Code
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Import routes (Phase 6 version)
const employeeRoutes = require('./src/routes/employeeRoutes-phase6');
const authRoutes = require('./src/routes/auth.routes');
const ermRoutes = require('./src/routes/erm.routes');
const salaryRoutes = require('./src/routes/salary.routes');

// Import middleware
const correlationIdMiddleware = require('./src/middlewares/correlationId.middleware');
const errorHandlerMiddleware = require('./src/middlewares/errorHandler.middleware');

const app = express();

/**
 * MIDDLEWARE SETUP - CRITICAL ORDER
 * 
 * This order is important:
 * 1. Helmet - Security headers
 * 2. CORS - Cross-origin handling
 * 3. Body parsers - JSON/form parsing
 * 4. Morgan - Request logging
 * 5. MongoDB sanitization - Injection prevention
 * 6. Global rate limiting - DOS protection
 * 7. Correlation ID - Request tracing
 * 8. Routes
 * 9. Error handling - Final catch-all
 */

// 1. Security: Helmet.js - Set security HTTP headers
app.use(helmet());
console.log('[APP] Helmet security headers enabled');

// 2. CORS: Enable cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));
console.log('[APP] CORS enabled');

// 3. Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
console.log('[APP] Body parsers configured');

// 4. Request Logging: Morgan - HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));
  console.log('[APP] Morgan HTTP logging enabled');
}

// 5. MongoDB Sanitization - Data sanitization against NoSQL injection
app.use(mongoSanitize());
console.log('[APP] MongoDB sanitization enabled');

// 6. Global Rate Limiting - Protect against DOS attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return RateLimit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
});
app.use(globalLimiter);
console.log('[APP] Global rate limiting configured (100 req/15min per IP)');

// 7. Correlation ID Middleware - Request tracing
app.use(correlationIdMiddleware);
console.log('[APP] Correlation ID middleware enabled');

// 8. Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    correlationId: req.correlationId
  });
});
console.log('[APP] Health check endpoint enabled: GET /health');

// 9. API Version Endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '2.0.0',
    phase: 'PHASE 6 - Enhanced with Middleware Integration',
    deployedAt: new Date().toISOString(),
    correlationId: req.correlationId
  });
});
console.log('[APP] API version endpoint enabled: GET /api/version');

/**
 * ROUTES REGISTRATION
 * All routes inherit middleware stack from app.use()
 */

console.log('[APP] Registering routes...');

// Employee routes (Phase 6 - with full middleware stack)
app.use(employeeRoutes);
console.log('[APP] Employee routes registered (Phase 6 enhanced)');

// Auth routes
app.use('/api/auth', authRoutes);
console.log('[APP] Authentication routes registered');

// ERM routes
app.use('/api/erms', ermRoutes);
console.log('[APP] ERM sync routes registered');

// Salary routes
app.use('/api/salary', salaryRoutes);
console.log('[APP] Salary management routes registered');

/**
 * 404 Handler - Not found
 */
app.use((req, res) => {
  const correlationId = req.correlationId || 'unknown';
  console.warn(`[${correlationId}] 404 Not Found: ${req.method} ${req.path}`);
  
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    correlationId,
    availableEndpoints: [
      'GET /health',
      'GET /api/version',
      'POST /api/employees',
      'PUT /api/employees/:employeeId/terminate',
      'GET /api/employees/:employeeId/sync-status'
    ]
  });
});
console.log('[APP] 404 handler registered');

/**
 * 9. Error Handling Middleware - MUST be last
 * Catches all errors thrown by routes and other middleware
 */
app.use((err, req, res, next) => {
  const correlationId = req.correlationId || 'unknown';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const statusCode = err.statusCode || 500;

  console.error(`[${correlationId}] Global error handler caught:`, {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    statusCode
  });

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    correlationId,
    error: isDevelopment ? err.stack : 'Internal error',
    timestamp: new Date().toISOString()
  });
});
console.log('[APP] Global error handler middleware registered');

/**
 * Server Startup
 */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────┐`);
  console.log(`│   PORTFOLIX COMPASS BACKEND - PHASE 6   │`);
  console.log(`│     Production Server Started           │`);
  console.log(`├─────────────────────────────────────────┤`);
  console.log(`│   Port: ${PORT}                               │`);
  console.log(`│   Environment: ${process.env.NODE_ENV || 'development'}        │`);
  console.log(`│   Middleware Stack: ENABLED             │`);
  console.log(`│   Correlation ID Tracing: ENABLED       │`);
  console.log(`│   Global Rate Limiting: ENABLED         │`);
  console.log(`│   Security Headers: ENABLED             │`);
  console.log(`└─────────────────────────────────────────┘\n`);
});

/**
 * Graceful Shutdown Handler
 */
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
