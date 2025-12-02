const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  calculatePayroll,
  getPayroll,
  approvePayroll,
  processPayroll,
  archivePayroll
} = require('../controllers/payrollController');

const router = express.Router();

/**
 * @route   POST /payroll/calculate
 * @desc    Calculate monthly payroll for employees
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * POST /payroll/calculate
 * Authorization: Bearer <accessToken>
 * {
 *   "month": "2025-01-01",
 *   "employeeIds": ["optional-id-1", "optional-id-2"]
 * }
 *
 * @response 201 - Payroll calculated successfully
 */
router.post('/calculate', authenticate, calculatePayroll);

/**
 * @route   GET /payroll
 * @desc    Get payroll records with filters (powers Payroll Register UI)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 * @query   ?page=1&limit=10&month=2025-01-01&status=CALCULATED&department=Sales
 *
 * @example
 * GET /payroll?page=1&limit=20&month=2025-01-01&status=APPROVED
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Payroll records with pagination
 * Returns: employees + calculated salary + deductions + net salary
 */
router.get('/', authenticate, getPayroll);

/**
 * @route   PATCH /payroll/:id/approve
 * @desc    Approve payroll (CALCULATED -> APPROVED)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * PATCH /payroll/payroll-uuid/approve
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Payroll approved successfully
 */
router.patch('/:id/approve', authenticate, approvePayroll);

/**
 * @route   PATCH /payroll/:id/process
 * @desc    Process approved payroll (APPROVED -> PROCESSED)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * PATCH /payroll/payroll-uuid/process
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Payroll processed successfully
 */
router.patch('/:id/process', authenticate, processPayroll);

/**
 * @route   PATCH /payroll/:id/archive
 * @desc    Archive paid payroll (PROCESSED -> PAID)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * PATCH /payroll/payroll-uuid/archive
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Payroll marked as paid and archived
 */
router.patch('/:id/archive', authenticate, archivePayroll);

module.exports = router;
