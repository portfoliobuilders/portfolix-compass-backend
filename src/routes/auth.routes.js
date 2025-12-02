/**
 * Authentication Routes
 * POST /auth/login - User login (no auth required)
 * POST /auth/refresh - Refresh access token
 * POST /auth/switch-company - Switch to different company (multi-tenant)
 * POST /auth/logout - Logout (no backend action needed)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const authController = require('../controllers/authController');

/**
 * POST /auth/login
 * User authentication endpoint
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "companyId": "company_001" (optional, uses first company if not provided)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, email, name, role },
 *     "company": { id, name },
 *     "tokens": {
 *       "accessToken": "jwt_token...",
 *       "refreshToken": "jwt_token...",
 *       "expiresIn": "24h"
 *     }
 *   }
 * }
 */
router.post('/login', authController.login);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 *
 * Request body:
 * {
 *   "refreshToken": "jwt_refresh_token..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "new_jwt_token...",
 *     "expiresIn": "24h"
 *   }
 * }
 */
router.post('/refresh', authController.refreshAccessToken);

/**
 * POST /auth/switch-company
 * Switch to a different company (for multi-tenant setup)
 * CRITICAL: Enables user to switch between Portfolio Builders, portfolix.tech, portfolix.media
 *
 * Request body:
 * {
 *   "companyId": "company_002"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "company": { id, name },
 *     "tokens": { accessToken, refreshToken, expiresIn }
 *   }
 * }
 *
 * Requires: Bearer token in Authorization header
 */
router.post('/switch-company', authenticate, authController.switchCompany);

/**
 * POST /auth/logout
 * Logout user (client removes token from local storage)
 *
 * Requires: Bearer token in Authorization header
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
