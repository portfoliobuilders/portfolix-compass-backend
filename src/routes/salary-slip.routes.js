/**
 * Salary Slip Routes
 * POST /salary-slips/calculate - Calculate and generate salary slip
 * GET /salary-slips - List all salary slips
 * GET /salary-slips/:id - Get salary slip by ID
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const salarySlipController = require('../controllers/salarySlipController');

/**
 * POST /salary-slips/calculate
 * Generate salary slip for an employee
 * 
 * Request body:
 * {
 *   "employeeId": "emp_123",
 *   "salaryStructureId": "ss_123",
 *   "month": "2025-01-01"
 * }
 */
router.post('/calculate', authenticate, salarySlipController.calculateSalary);

/**
 * GET /salary-slips
 * List salary slips with pagination
 * 
 * Query parameters:
 * - page: 1 (default)
 * - limit: 20 (default)
 * - employeeId: filter by employee
 * - month: filter by month (YYYY-MM-DD)
 */
router.get('/', authenticate, salarySlipController.listSalarySlips);

/**
 * GET /salary-slips/:id
 * Get salary slip details
 */
router.get('/:id', authenticate, salarySlipController.getSalarySlip);

module.exports = router;
