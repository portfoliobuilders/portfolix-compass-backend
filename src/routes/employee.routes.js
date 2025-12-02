const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

const router = express.Router();

/**
 * @route   POST /employees
 * @desc    Create a new employee in the active company
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * POST /employees
 * Authorization: Bearer <accessToken>
 * {
 *   "firstName": "Rajesh",
 *   "lastName": "Kumar",
 *   "email": "rajesh.kumar@portfoliobuilders.com",
 *   "phone": "9876543210",
 *   "employeeCode": "PB001",
 *   "careerStage": "PROBATION",
 *   "salaryType": "STANDARD",
 *   "joiningDate": "2025-01-15",
 *   "department": "Sales",
 *   "designation": "Sales Executive",
 *   "reportingTo": "optional-manager-id",
 *   "bankName": "HDFC Bank",
 *   "bankAccount": "1234567890123456",
 *   "ifscCode": "HDFC0001234",
 *   "panNumber": "ABCDE1234F",
 *   "aadharNumber": "123456789012",
 *   "emergencyContact": "Priya Kumar",
 *   "emergencyPhone": "9876543211",
 *   "basicSalary": 25000,
 *   "hra": 7500,
 *   "da": 2500,
 *   "otherAllowances": 0
 * }
 *
 * @response 201 - Employee created successfully
 * {
 *   "success": true,
 *   "data": { "employee": { id, firstName, lastName, ... } },
 *   "message": "Employee created successfully",
 *   "timestamp": "2025-01-15T10:30:00Z"
 * }
 */
router.post('/', authenticate, createEmployee);

/**
 * @route   GET /employees
 * @desc    Get all employees in the active company with pagination and filters
 * @access  Private (authenticated)
 * @auth    Bearer token required
 * @query   ?page=1&limit=10&status=ACTIVE&careerStage=PROBATION&salaryType=STANDARD&search=rajesh
 *
 * @example
 * GET /employees?page=1&limit=10&status=ACTIVE
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Employees fetched successfully
 * {
 *   "success": true,
 *   "data": {
 *     "employees": [...],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 42,
 *       "pages": 5
 *     }
 *   },
 *   "message": "Employees fetched successfully",
 *   "timestamp": "2025-01-15T10:30:00Z"
 * }
 */
router.get('/', authenticate, getEmployees);

/**
 * @route   GET /employees/:id
 * @desc    Get single employee by ID (company-scoped)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * GET /employees/employee-uuid-12345
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Employee fetched successfully
 * {
 *   "success": true,
 *   "data": { "employee": { id, firstName, lastName, ... } },
 *   "message": "Employee fetched successfully",
 *   "timestamp": "2025-01-15T10:30:00Z"
 * }
 */
router.get('/:id', authenticate, getEmployee);

/**
 * @route   PATCH /employees/:id
 * @desc    Update employee details (partial update allowed)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * PATCH /employees/employee-uuid-12345
 * Authorization: Bearer <accessToken>
 * {
 *   "department": "Product",
 *   "designation": "Product Manager",
 *   "basicSalary": 45000
 * }
 *
 * @response 200 - Employee updated successfully
 * {
 *   "success": true,
 *   "data": { "employee": { id, firstName, lastName, ... } },
 *   "message": "Employee updated successfully",
 *   "timestamp": "2025-01-15T10:30:00Z"
 * }
 */
router.patch('/:id', authenticate, updateEmployee);

/**
 * @route   DELETE /employees/:id
 * @desc    Soft delete employee (sets status to INACTIVE)
 * @access  Private (authenticated)
 * @auth    Bearer token required
 *
 * @example
 * DELETE /employees/employee-uuid-12345
 * Authorization: Bearer <accessToken>
 *
 * @response 200 - Employee deleted successfully
 * {
 *   "success": true,
 *   "data": {},
 *   "message": "Employee deleted successfully",
 *   "timestamp": "2025-01-15T10:30:00Z"
 * }
 */
router.delete('/:id', authenticate, deleteEmployee);

module.exports = router;
