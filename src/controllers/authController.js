/**
 * Authentication Controller - PHASE 2 UPDATE
 * Handles user login, token generation, and token refresh
 * UPDATED: Now uses MongoDB User model exclusively (no Prisma)
 * Password field: user.password (not passwordHash)
 * Database: MongoDB with Mongoose ODM
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { HTTP_STATUS, ERROR_CODES, JWT_CONFIG } = require('../config/constants');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Generate JWT tokens (access + refresh)
 */
const generateTokens = (userId, companyId, role) => {
  const accessToken = jwt.sign(
    {
      id: userId,
      companyId,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    {
      id: userId,
      companyId,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
};

/**
 * POST /auth/login - Authenticate user with email and password
 * Database: MongoDB only (no Prisma)
 * Flow: Email -> Find in MongoDB -> Verify password -> Generate JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password, companyId } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Email and password are required',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Find user in MongoDB by email
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('companyId', 'name address phone')
      .exec();

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'User account is disabled',
          statusCode: HTTP_STATUS.FORBIDDEN,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Compare password using Mongoose method
    // user.password is already hashed; comparePassword uses bcrypt.compare
    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // If companyId provided, verify user has access
    let selectedCompanyId = companyId || user.companyId._id.toString();
    
    // Simple validation: user.companyId should match selectedCompanyId
    if (selectedCompanyId !== user.companyId._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'No access to specified company',
          statusCode: HTTP_STATUS.FORBIDDEN,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      selectedCompanyId,
      user.role
    );

    // Return success response
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          permissions: user.permissions || [],
        },
        company: {
          id: user.companyId._id,
          name: user.companyId.name,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
        },
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh - Generate new access token using refresh token
 * Validates token and regenerates access token
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Refresh token is required',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Verify user still exists in MongoDB
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: 'Invalid refresh token - user not found or inactive',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            timestamp: new Date().toISOString(),
            requestId: req.id,
          },
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user._id.toString(),
          companyId: decoded.companyId,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
        },
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.TOKEN_EXPIRED,
            message: 'Refresh token has expired',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            timestamp: new Date().toISOString(),
            requestId: req.id,
          },
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: 'Invalid refresh token',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            timestamp: new Date().toISOString(),
            requestId: req.id,
          },
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/switch-company - Switch to a different company
 * Not fully implemented in PHASE 2 (users assigned to single company in MongoDB)
 * For multi-company support, will need extended user profile model
 */
const switchCompany = async (req, res, next) => {
  try {
    const { companyId } = req.body;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Company ID is required',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Find user in MongoDB
    const user = await User.findById(userId).populate('companyId');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'User not found',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // For PHASE 2: Users are single-company only
    // This check ensures companyId matches user's assigned company
    if (user.companyId._id.toString() !== companyId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'No access to this company',
          statusCode: HTTP_STATUS.FORBIDDEN,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Generate new tokens with company context
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      companyId,
      user.role
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        company: {
          id: user.companyId._id,
          name: user.companyId.name,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
        },
      },
      message: 'Company context switched successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout - Logout (client removes token)
 * Note: With JWT, logout is client-side. Token is valid until expiry.
 * For production, implement token blacklist/revocation system
 */
const logout = async (req, res, next) => {
  try {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {},
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refreshAccessToken,
  switchCompany,
  logout,
};
