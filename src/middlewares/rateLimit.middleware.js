const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../config/logger');

/**
 * Rate Limiting Middleware
 * Protects endpoints from abuse and DDoS attacks
 * Fixes P1-HRM-007: No rate limiting on endpoints
 */

// Create Redis client for distributed rate limiting
let redisClient = null;
try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  });
  redisClient.connect().catch(err => {
    logger.warn('Redis client connection failed, using memory store', { error: err.message });
    redisClient = null;
  });
} catch (err) {
  logger.warn('Redis not available, using memory store for rate limiting', { error: err.message });
}

/**
 * Sync Endpoint Rate Limiter
 * 100 requests per minute per correlation ID or IP
 * Lower limit for critical sync operations
 */
const syncLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:sync:',
    expiry: 60 // 1 minute
  }) : undefined,
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // Max 100 requests per minute
  message: 'Too many sync requests, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use correlation ID as key for better tracking
    return req.correlationId || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user && (req.user.role === 'admin' || req.user.role === 'system');
  },
  handler: (req, res) => {
    logger.warn('Sync rate limit exceeded', {
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.path,
      userId: req.user?._id
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Employee Endpoint Rate Limiter
 * 30 requests per minute per user
 * Moderate limit for employee CRUD operations
 */
const employeeLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:employee:',
    expiry: 60
  }) : undefined,
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many employee requests, please try again later',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user ? req.user._id : req.ip;
  },
  skip: (req) => req.user && req.user.role === 'admin',
  handler: (req, res) => {
    logger.warn('Employee rate limit exceeded', {
      correlationId: req.correlationId,
      userId: req.user?._id,
      ip: req.ip
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Attendance Endpoint Rate Limiter
 * 50 requests per minute per user
 * Moderate-high limit for frequent attendance updates
 */
const attendanceLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:attendance:',
    expiry: 60
  }) : undefined,
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many attendance requests, please try again later',
  keyGenerator: (req) => req.user ? req.user._id : req.ip,
  skip: (req) => req.user && req.user.role === 'admin',
  handler: (req, res) => {
    logger.warn('Attendance rate limit exceeded', {
      correlationId: req.correlationId,
      userId: req.user?._id
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Authentication Endpoint Rate Limiter
 * 10 requests per minute per IP
 * Very strict limit for login/signup endpoints
 */
const authLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
    expiry: 60
  }) : undefined,
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      correlationId: req.correlationId,
      ip: req.ip,
      email: req.body?.email
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * API-wide Rate Limiter
 * 1000 requests per 15 minutes per IP
 * Catch-all limit for overall API protection
 */
const apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
    expiry: 15 * 60
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    // Skip for admins and internal services
    return req.user && (req.user.role === 'admin' || req.user.role === 'system');
  }
});

// Graceful shutdown for Redis client
process.on('SIGTERM', () => {
  if (redisClient) {
    redisClient.quit().catch(err => {
      logger.error('Error closing Redis connection', { error: err.message });
    });
  }
});

module.exports = {
  syncLimiter,
  employeeLimiter,
  attendanceLimiter,
  authLimiter,
  apiLimiter
};
