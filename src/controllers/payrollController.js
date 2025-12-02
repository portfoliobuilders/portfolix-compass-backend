const Joi = require('joi');
const prisma = require('../config/database');
const SalaryCalculationService = require('../services/SalaryCalculationService');
const { PAYROLL_STATUS, PAGINATION_DEFAULTS } = require('../config/constants');
const { AppError, ValidationError } = require('../utils/errorHandler');

/**
 * @desc Calculate payroll for employees in active company for a specific month
 * @route POST /payroll/calculate
 * @access Private (authenticated)
 * @param {Object} req - Express request object
 * @param {string} req.user.companyId - Active company ID from JWT token
 * @returns {Object} Success response with created payroll records
 */
const calculatePayroll = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { month, employeeIds } = req.body;

    // Validation
    const schema = Joi.object({
      month: Joi.date().required(), // First day of month
      employeeIds: Joi.array().items(Joi.string().uuid()).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) throw new ValidationError('Validation failed', [{ field: error.details[0].path[0], message: error.message }]);

    // Standardize month to first day
    const monthDate = new Date(value.month);
    monthDate.setDate(1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

    // Get employees to calculate (all active or specific IDs)
    const whereClause = {
      companyId,
      status: 'ACTIVE'
    };
    if (value.employeeIds && value.employeeIds.length > 0) {
      whereClause.id = { in: value.employeeIds };
    }

    const employees = await prisma.employee.findMany({ where: whereClause });
    if (employees.length === 0) {
      throw new AppError('No active employees found', 404);
    }

    // Check for duplicate payroll records for this month
    const existingPayrolls = await prisma.payroll.findMany({
      where: {
        companyId,
        month: monthStart,
        employeeId: { in: employees.map(e => e.id) }
      }
    });

    if (existingPayrolls.length > 0) {
      throw new AppError(`Payroll already exists for ${existingPayrolls.length} employee(s) in this month`, 409);
    }

    // Calculate payroll for each employee
    const payrolls = [];
    for (const employee of employees) {
      const salaryCalculation = SalaryCalculationService.calculateSalary(employee, month Date.getMonth() + 1);
      
      const payroll = await prisma.payroll.create({
        data: {
          companyId,
          employeeId: employee.id,
          month: monthStart,
          status: PAYROLL_STATUS.CALCULATED,
          basicSalary: new Decimal(employee.basicSalary),
          hra: new Decimal(employee.hra),
          da: new Decimal(employee.da),
          allowances: new Decimal(employee.otherAllowances || 0),
          earnings: salaryCalculation.totalEarnings,
          pfDeduction: salaryCalculation.pf,
          ptDeduction: salaryCalculation.pt,
          esiDeduction: salaryCalculation.esi,
          itDeduction: salaryCalculation.it,
          totalDeductions: salaryCalculation.totalDeductions,
          netSalary: salaryCalculation.netSalary,
          ctc: salaryCalculation.ctc
        }
      });
      payrolls.push(payroll);
    }

    return res.status(201).json({
      success: true,
      data: { payrolls, count: payrolls.length },
      message: `Payroll calculated for ${payrolls.length} employee(s)`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get payroll records for active company with filters and pagination
 * @route GET /payroll?page=1&limit=10&month=2025-01-01&status=CALCULATED
 * @access Private (authenticated)
 * @returns {Object} Success response with payroll list for register
 */
const getPayroll = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, month, status, department } = req.query;

    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).max(100).optional().default(PAGINATION_DEFAULTS.LIMIT),
      month: Joi.date().optional(),
      status: Joi.string().optional(),
      department: Joi.string().optional()
    });

    const { error, value } = schema.validate(req.query);
    if (error) throw new ValidationError('Invalid query parameters', [{ field: error.details[0].path[0], message: error.message }]);

    // Build filter
    const where = { companyId };
    if (value.month) {
      const dateObj = new Date(value.month);
      dateObj.setDate(1);
      where.month = dateObj;
    }
    if (value.status) where.status = value.status;
    if (value.department) {
      where.employee = { department: value.department };
    }

    const skip = (value.page - 1) * value.limit;

    // Fetch with employee details
    const [total, payrolls] = await Promise.all([
      prisma.payroll.count({ where }),
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              email: true,
              department: true,
              designation: true,
              careerStage: true
            }
          }
        },
        orderBy: { month: 'desc' },
        skip,
        take: value.limit
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        payrolls,
        pagination: {
          page: value.page,
          limit: value.limit,
          total,
          pages: Math.ceil(total / value.limit)
        }
      },
      message: 'Payroll records fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Approve payroll (status change: CALCULATED -> APPROVED)
 * @route PATCH /payroll/:id/approve
 * @access Private (authenticated)
 */
const approvePayroll = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!id) throw new AppError('Payroll ID is required', 400);

    const payroll = await prisma.payroll.findFirst({
      where: { id, companyId }
    });

    if (!payroll) throw new AppError('Payroll not found', 404);
    if (payroll.status !== PAYROLL_STATUS.CALCULATED) {
      throw new AppError('Payroll must be in CALCULATED status to approve', 400);
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status: PAYROLL_STATUS.APPROVED }
    });

    return res.status(200).json({
      success: true,
      data: { payroll: updated },
      message: 'Payroll approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Process approved payroll (status change: APPROVED -> PROCESSED)
 * @route PATCH /payroll/:id/process
 * @access Private (authenticated)
 */
const processPayroll = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!id) throw new AppError('Payroll ID is required', 400);

    const payroll = await prisma.payroll.findFirst({
      where: { id, companyId }
    });

    if (!payroll) throw new AppError('Payroll not found', 404);
    if (payroll.status !== PAYROLL_STATUS.APPROVED) {
      throw new AppError('Payroll must be in APPROVED status to process', 400);
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status: PAYROLL_STATUS.PROCESSED }
    });

    return res.status(200).json({
      success: true,
      data: { payroll: updated },
      message: 'Payroll processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Archive paid payroll (status change: PROCESSED -> PAID -> ARCHIVED)
 * @route PATCH /payroll/:id/archive
 * @access Private (authenticated)
 */
const archivePayroll = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!id) throw new AppError('Payroll ID is required', 400);

    const payroll = await prisma.payroll.findFirst({
      where: { id, companyId }
    });

    if (!payroll) throw new AppError('Payroll not found', 404);
    if (payroll.status !== PAYROLL_STATUS.PROCESSED) {
      throw new AppError('Payroll must be in PROCESSED status to archive', 400);
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status: PAYROLL_STATUS.PAID }
    });

    return res.status(200).json({
      success: true,
      data: { payroll: updated },
      message: 'Payroll marked as paid and archived',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculatePayroll,
  getPayroll,
  approvePayroll,
  processPayroll,
  archivePayroll
};
