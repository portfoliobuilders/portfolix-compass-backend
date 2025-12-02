/**
 * Authentication Controller
 * Handles user login, token generation, and token refresh
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { HTTP_STATUS, ERROR_CODES, JWT_CONFIG } = require('../config/constants');
const prisma = require('../config/database');

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
 * Multi-company support: Returns JWT with companyId in payload
 */
const login = async (req, res, next) => {
  try {
    const { email, password, companyId } = req.body;

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

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companies: {
          include: { company: true },
        },
      },
    });

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

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
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

    let selectedCompany = companyId
      ? user.companies.find((uc) => uc.companyId === companyId)
      : user.companies[0];

    if (!selectedCompany) {
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

    const { accessToken, refreshToken } = generateTokens(
      user.id,
      selectedCompany.companyId,
      selectedCompany.role
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: selectedCompany.role,
        },
        company: {
          id: selectedCompany.company.id,
          name: selectedCompany.company.name,
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
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const userCompany = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId: decoded.id,
            companyId: decoded.companyId,
          },
        },
      });

      if (!userCompany) {
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

      const newAccessToken = jwt.sign(
        {
          id: decoded.id,
          companyId: decoded.companyId,
          role: userCompany.role,
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
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/switch-company - Switch to a different company
 * Critical for multi-tenant support (Portfolio Builders, portfolix.tech, portfolix.media)
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

    const userCompany = await prisma.userCompany.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
      include: { company: true },
    });

    if (!userCompany) {
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

    const { accessToken, refreshToken } = generateTokens(
      userId,
      companyId,
      userCompany.role
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        company: {
          id: userCompany.company.id,
          name: userCompany.company.name,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
        },
      },
      message: 'Company switched successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout - Logout (client removes token)
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
