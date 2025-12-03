/**
 * PHASE 6: Enhanced Employee Routes with Middleware Integration
 * Features: Full middleware stack, error handling, sync endpoints
 * Date: December 4, 2025
 * Status: Production-Ready Code
 */

const express = require('express');
const router = express.Router();

// Import middleware
const correlationIdMiddleware = require('../middlewares/correlationId.middleware');
const validateInputMiddleware = require('../middlewares/validateInput.middleware');
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const errorHandlerMiddleware = require('../middlewares/errorHandler.middleware');

// Import controller (Phase 6 enhanced version)
const employeeController = require('../controllers/employeeController-phase6');

/**
 * Middleware Stack Order (CRITICAL - do not change order)
 * 1. correlationIdMiddleware - Injects correlation ID for tracing
 * 2. validateInputMiddleware - Validates request payload
 * 3. rateLimitMiddleware - Enforces rate limiting (5 req/min per user)
 * 4. Route handlers
 * 5. errorHandlerMiddleware - Catches and formats errors
 */

// Apply correlation ID middleware to all routes
router.use(correlationIdMiddleware);

/**
 * POST /api/employees
 * Create new employee and sync to ERM
 * 
 * Request body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@company.com",
 *   "employeeId": "EMP001",
 *   "department": "Engineering",
 *   "designation": "Senior Developer"
 * }
 * 
 * Response (201 - Success):
 * {
 *   "success": true,
 *   "message": "Employee created and synced to ERM successfully",
 *   "correlationId": "uuid-string",
 *   "employee": {
 *     "hrmId": "id",
 *     "ermId": "erm-id",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "employeeId": "EMP001"
 *   },
 *   "syncMetrics": {
 *     "attempts": 1,
 *     "responseTime": "245ms",
 *     "status": "SYNCED"
 *   }
 * }
 * 
 * Response (202 - Partial Success):
 * {
 *   "success": false,
 *   "message": "Employee created in HRM but ERM sync failed. Will retry automatically.",
 *   "correlationId": "uuid-string",
 *   "employee": "hrm-id",
 *   "error": "ERM API timeout",
 *   "retryInfo": {
 *     "attempts": 3,
 *     "nextRetryIn": "5 minutes"
 *   }
 * }
 */
router.post(
  '/api/employees',
  rateLimitMiddleware,
  validateInputMiddleware.validateEmployeeCreation,
  errorHandlerMiddleware,
  employeeController.createEmployee
);

/**
 * PUT /api/employees/:employeeId/terminate
 * Terminate employee and sync to ERM
 * 
 * Request body:
 * {
 *   "reason": "Resignation",
 *   "lastWorkingDay": "2025-12-31"
 * }
 * 
 * Response (200 - Success):
 * {
 *   "success": true,
 *   "message": "Employee terminated and synced to ERM successfully",
 *   "correlationId": "uuid-string",
 *   "employee": "hrm-id",
 *   "terminationData": {
 *     "status": "terminated",
 *     "terminationReason": "Resignation",
 *     "lastWorkingDay": "2025-12-31T00:00:00.000Z",
 *     "terminatedAt": "2025-12-04T04:00:00.000Z"
 *   },
 *   "syncMetrics": {
 *     "attempts": 1,
 *     "responseTime": "312ms",
 *     "status": "SYNCED"
 *   }
 * }
 * 
 * Response (202 - Partial Success):
 * {
 *   "success": false,
 *   "message": "Employee terminated in HRM but ERM sync failed. Will retry automatically.",
 *   "correlationId": "uuid-string",
 *   "employee": "hrm-id",
 *   "error": "Network timeout"
 * }
 */
router.put(
  '/api/employees/:employeeId/terminate',
  rateLimitMiddleware,
  validateInputMiddleware.validateEmployeeTermination,
  errorHandlerMiddleware,
  employeeController.terminateEmployee
);

/**
 * GET /api/employees/:employeeId/sync-status
 * Retrieve employee sync status and history
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "employee": {
 *     "hrmId": "id",
 *     "employeeId": "EMP001",
 *     "syncStatus": "completed",
 *     "ermId": "erm-id",
 *     "syncedAt": "2025-12-04T04:00:00.000Z"
 *   },
 *   "syncHistory": [
 *     {
 *       "syncId": "sync-uuid",
 *       "operation": "CREATE_EMPLOYEE",
 *       "status": "SUCCESS",
 *       "attempts": 1,
 *       "responseTime": "245ms",
 *       "timestamp": "2025-12-04T04:00:00.000Z"
 *     },
 *     ...
 *   ],
 *   "correlationId": "uuid-string"
 * }
 */
router.get(
  '/api/employees/:employeeId/sync-status',
  rateLimitMiddleware,
  errorHandlerMiddleware,
  employeeController.getEmployeeSyncStatus
);

/**
 * Error Handler (Global for all routes)
 * Catches all errors and formats response with correlation ID
 */
router.use((err, req, res, next) => {
  const correlationId = req.correlationId || 'unknown';
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  console.error(`[${correlationId}] Error caught by global handler:`, err);

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    correlationId,
    error: isDevelopment ? err.stack : 'Internal error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
