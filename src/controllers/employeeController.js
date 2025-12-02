const Joi = require('joi');
const prisma = require('../config/database');
const { EMPLOYEE_STATUS, CAREER_STAGES, SALARY_TYPES, PAGINATION_DEFAULTS } = require('../config/constants');
const { AppError, ValidationError } = require('../utils/errorHandler');

/**
 * @desc Create a new employee in the active company
 * @route POST /employees
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @param {string} req.user.companyId - Active company ID from JWT token
 * @returns {Object} Success response with created employee data
 */
const createEmployee = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeCode,
      careerStage,
      salaryType,
      joiningDate,
      department,
      designation,
      reportingTo,
      bankName,
      bankAccount,
      ifscCode,
      panNumber,
      aadharNumber,
      emergencyContact,
      emergencyPhone,
      basicSalary,
      hra,
      da,
      otherAllowances
    } = req.body;

    // Validation
    const schema = Joi.object({
      firstName: Joi.string().required().trim(),
      lastName: Joi.string().required().trim(),
      email: Joi.string().email().required().trim().lowercase(),
      phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      employeeCode: Joi.string().required().trim().uppercase(),
      careerStage: Joi.string().valid(...Object.values(CAREER_STAGES)).required(),
      salaryType: Joi.string().valid(...Object.values(SALARY_TYPES)).required(),
      joiningDate: Joi.date().required(),
      department: Joi.string().required().trim(),
      designation: Joi.string().required().trim(),
      reportingTo: Joi.string().uuid().optional().allow(null),
      bankName: Joi.string().required().trim(),
      bankAccount: Joi.string().required().trim(),
      ifscCode: Joi.string().required().trim().uppercase(),
      panNumber: Joi.string().required().trim().uppercase(),
      aadharNumber: Joi.string().required().trim(),
      emergencyContact: Joi.string().required().trim(),
      emergencyPhone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      basicSalary: Joi.number().precision(2).positive().required(),
      hra: Joi.number().precision(2).positive().required(),
      da: Joi.number().precision(2).positive().required(),
      otherAllowances: Joi.number().precision(2).positive().optional().default(0)
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map(d => ({ field: d.path[0], message: d.message }));
      throw new ValidationError('Validation failed', details);
    }

    // Check for duplicate email and employee code within company
    const existing = await prisma.employee.findFirst({
      where: {
        AND: [
          { companyId },
          {
            OR: [
              { email: value.email },
              { employeeCode: value.employeeCode }
            ]
          }
        ]
      }
    });

    if (existing) {
      throw new AppError('Email or Employee Code already exists in this company', 400);
    }

    // Verify reporting manager exists and belongs to same company
    if (value.reportingTo) {
      const reportingManager = await prisma.employee.findFirst({
        where: { id: value.reportingTo, companyId }
      });
      if (!reportingManager) {
        throw new AppError('Reporting manager not found in this company', 404);
      }
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        companyId,
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
        employeeCode: value.employeeCode,
        careerStage: value.careerStage,
        salaryType: value.salaryType,
        status: EMPLOYEE_STATUS.ACTIVE,
        joiningDate: new Date(value.joiningDate),
        department: value.department,
        designation: value.designation,
        reportingTo: value.reportingTo || null,
        bankName: value.bankName,
        bankAccount: value.bankAccount,
        ifscCode: value.ifscCode,
        panNumber: value.panNumber,
        aadharNumber: value.aadharNumber,
        emergencyContact: value.emergencyContact,
        emergencyPhone: value.emergencyPhone,
        basicSalary: value.basicSalary,
        hra: value.hra,
        da: value.da,
        otherAllowances: value.otherAllowances || 0
      }
    });

    return res.status(201).json({
      success: true,
      data: { employee },
      message: 'Employee created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all employees in the active company with pagination and filters
 * @route GET /employees?page=1&limit=10&status=ACTIVE&careerStage=PROBATION
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @param {string} req.user.companyId - Active company ID from JWT token
 * @returns {Object} Success response with paginated employee list
 */
const getEmployees = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, status, careerStage, salaryType, search } = req.query;

    // Validation
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).max(100).optional().default(PAGINATION_DEFAULTS.LIMIT),
      status: Joi.string().valid(...Object.values(EMPLOYEE_STATUS)).optional(),
      careerStage: Joi.string().valid(...Object.values(CAREER_STAGES)).optional(),
      salaryType: Joi.string().valid(...Object.values(SALARY_TYPES)).optional(),
      search: Joi.string().trim().optional()
    });

    const { error, value } = schema.validate(req.query);
    if (error) throw new ValidationError('Invalid query parameters', [{ field: error.details[0].path[0], message: error.message }]);

    // Build filter
    const where = { companyId };
    if (value.status) where.status = value.status;
    if (value.careerStage) where.careerStage = value.careerStage;
    if (value.salaryType) where.salaryType = value.salaryType;
    if (value.search) {
      where.OR = [
        { firstName: { contains: value.search, mode: 'insensitive' } },
        { lastName: { contains: value.search, mode: 'insensitive' } },
        { email: { contains: value.search, mode: 'insensitive' } },
        { employeeCode: { contains: value.search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (value.page - 1) * value.limit;

    // Fetch total count and employees
    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          companyId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          employeeCode: true,
          careerStage: true,
          salaryType: true,
          status: true,
          joiningDate: true,
          department: true,
          designation: true,
          basicSalary: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: value.limit
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          page: value.page,
          limit: value.limit,
          total,
          pages: Math.ceil(total / value.limit)
        }
      },
      message: 'Employees fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single employee by ID
 * @route GET /employees/:id
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @returns {Object} Success response with employee data
 */
const getEmployee = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Validation
    if (!id) throw new AppError('Employee ID is required', 400);

    const employee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: { employee },
      message: 'Employee fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update employee details
 * @route PATCH /employees/:id
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @returns {Object} Success response with updated employee data
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (!id) throw new AppError('Employee ID is required', 400);

    // Validation - allow partial updates
    const schema = Joi.object({
      firstName: Joi.string().trim().optional(),
      lastName: Joi.string().trim().optional(),
      phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
      careerStage: Joi.string().valid(...Object.values(CAREER_STAGES)).optional(),
      status: Joi.string().valid(...Object.values(EMPLOYEE_STATUS)).optional(),
      department: Joi.string().trim().optional(),
      designation: Joi.string().trim().optional(),
      bankName: Joi.string().trim().optional(),
      bankAccount: Joi.string().trim().optional(),
      ifscCode: Joi.string().trim().uppercase().optional(),
      panNumber: Joi.string().trim().uppercase().optional(),
      basicSalary: Joi.number().precision(2).positive().optional(),
      hra: Joi.number().precision(2).positive().optional(),
      da: Joi.number().precision(2).positive().optional(),
      otherAllowances: Joi.number().precision(2).positive().optional()
    });

    const { error, value } = schema.validate(updates);
    if (error) {
      const details = error.details.map(d => ({ field: d.path[0], message: d.message }));
      throw new ValidationError('Validation failed', details);
    }

    // Verify employee exists and belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: value
    });

    return res.status(200).json({
      success: true,
      data: { employee: updatedEmployee },
      message: 'Employee updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft delete employee (set status to INACTIVE)
 * @route DELETE /employees/:id
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @returns {Object} Success response
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!id) throw new AppError('Employee ID is required', 400);

    // Verify employee exists and belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Soft delete by setting status to INACTIVE
    await prisma.employee.update({
      where: { id },
      data: { status: EMPLOYEE_STATUS.INACTIVE }
    });

    return res.status(200).json({
      success: true,
      data: {},
      message: 'Employee deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
};
