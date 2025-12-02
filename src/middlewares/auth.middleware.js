/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user information to requests
 */

const jwt = require('jsonwebtoken');
const { ERROR_CODES, HTTP_STATUS } = require('../config/constants');

/**
 * Verify JWT token and extract user information
 * Expects token in Authorization header: Bearer <token>
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Missing or invalid authorization header',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.TOKEN_EXPIRED,
            message: 'JWT token has expired',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            timestamp: new Date().toISOString(),
            requestId: req.id,
          },
        });
      }
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid JWT token',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Authentication error',
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }
};

/**
 * Optional authentication - continues even if token is invalid
 * Useful for public endpoints that can have authenticated or unauthenticated users
 */
const authenticateOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Token is invalid but continue anyway
        req.user = null;
      }
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
};
