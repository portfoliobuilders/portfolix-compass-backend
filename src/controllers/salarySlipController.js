/**
 * Salary Slip Controller
 * Handles salary slip generation and retrieval
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const SalaryCalculationService = require('../services/SalaryCalculationService');
const prisma = require('../config/database');

/**
 * POST /salary-slips/calculate
 * Calculate salary for an employee
 */
const calculateSalary = async (req, res, next) => {
  try {
    const { employeeId, salaryStructureId, month } = req.body;

    // Validate required fields
    if (!employeeId || !salaryStructureId || !month) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Missing required fields: employeeId, salaryStructureId, month',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Fetch employee with sales performance data
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        salesPerformance: true,
        referrals: true,
      },
    });

    if (!employee) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Employee not found',
          statusCode: HTTP_STATUS.NOT_FOUND,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Fetch salary structure
    const salaryStructure = await prisma.salaryStructure.findUnique({
      where: { id: salaryStructureId },
      include: {
        commissionTiers: true,
      },
    });

    if (!salaryStructure) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Salary structure not found',
          statusCode: HTTP_STATUS.NOT_FOUND,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Validate salary structure
    SalaryCalculationService.validateSalaryStructure(salaryStructure);

    // Calculate salary
    const salaryCalculation = SalaryCalculationService.calculateSalary(
      employee,
      salaryStructure,
      month
    );

    // Save salary slip to database
    const salarySlip = await prisma.salarySlip.create({
      data: {
        employeeId,
        salaryStructureId,
        month: new Date(month),
        calculationData: salaryCalculation,
        gross: salaryCalculation.components.gross,
        net: salaryCalculation.net,
      },
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        id: salarySlip.id,
        employee: {
          id: employee.id,
          name: employee.name,
          employeeCode: employee.employeeCode,
        },
        ...salaryCalculation,
      },
      message: 'Salary calculated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /salary-slips/:id
 * Get salary slip details
 */
const getSalarySlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const salarySlip = await prisma.salarySlip.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
        salaryStructure: true,
      },
    });

    if (!salarySlip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Salary slip not found',
          statusCode: HTTP_STATUS.NOT_FOUND,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: salarySlip,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /salary-slips
 * List salary slips with pagination
 */
const listSalarySlips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, employeeId, month } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = new Date(month);

    const salarySlips = await prisma.salarySlip.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        employee: {
          select: { name: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.salarySlip.count({ where });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: salarySlips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  calculateSalary,
  getSalarySlip,
  listSalarySlips,
};
