/**
 * Centralized Error Handler Middleware
 * Handles all errors and provides standardized error responses
 */

const { ERROR_CODES, HTTP_STATUS } = require('../config/constants');

/**
 * Express error handling middleware
 * Must be defined after all other app.use() and routes calls
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Log error for debugging
  console.error(`[${timestamp}] Error [${requestId}]:`, err);
  
  // Handle validation errors (e.g., from Joi)
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        details,
        timestamp,
        requestId,
      },
    });
  }
  
  // Handle Prisma unique constraint errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'unknown';
    return res.status(HTTP_STATUS.CONFLICT).json({
      error: {
        code: ERROR_CODES.CONFLICT,
        message: `Record with this ${field} already exists`,
        statusCode: HTTP_STATUS.CONFLICT,
        details: [{ field, message: `Unique constraint violation` }],
        timestamp,
        requestId,
      },
    });
  }
  
  // Handle Prisma not found errors
  if (err.code === 'P2025') {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Record not found',
        statusCode: HTTP_STATUS.NOT_FOUND,
        timestamp,
        requestId,
      },
    });
  }
  
  // Handle Prisma database errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database operation failed',
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        timestamp,
        requestId,
      },
    });
  }
  
  // Handle custom application errors
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details || [],
        timestamp,
        requestId,
      },
    });
  }
  
  // Default: Internal server error
  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return res.status(statusCode).json({
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred processing your request' 
        : err.message,
      statusCode,
      timestamp,
      requestId,
    },
  });
};

/**
 * 404 Not Found middleware
 * Should be registered after all routes
 */
const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.path}`,
      statusCode: HTTP_STATUS.NOT_FOUND,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
