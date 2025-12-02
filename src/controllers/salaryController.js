const SalaryCalculationEngine = require('../services/SalaryCalculationEngine');

/**
 * POST /salary/calculate-standard
 * Calculate standard salary
 */
const calculateStandardSalary = async (req, res, next) => {
  try {
    const { basic = 0, specialAllowance = 0, otherAllowance = 0, incomeTax = 0, otherDeductions = 0 } = req.body;

    // Validate inputs
    if (typeof basic !== 'number' || basic < 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATIONERROR',
          message: 'basic must be a non-negative number',
          statusCode: 400
        }
      });
    }

    // Calculate
    const result = SalaryCalculationEngine.calculateStandardSalary({
      basic,
      specialAllowance,
      otherAllowance,
      incomeTax,
      otherDeductions
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVERERROR',
        message: error.message,
        statusCode: 500
      }
    });
  }
};

/**
 * POST /salary/calculate-sales
 * Calculate sales salary
 */
const calculateSalesSalary = async (req, res, next) => {
  try {
    const { careerStage = 'probation', salesCount = 0, referralCount = 0 } = req.body;

    // Validate inputs
    if (![' probation', 'established'].includes(careerStage)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATIONERROR',
          message: 'careerStage must be probation or established',
          statusCode: 400
        }
      });
    }
    if (typeof salesCount !== 'number' || salesCount < 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATIONERROR',
          message: 'salesCount must be a non-negative number',
          statusCode: 400
        }
      });
    }
    if (typeof referralCount !== 'number' || referralCount < 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATIONERROR',
          message: 'referralCount must be a non-negative number',
          statusCode: 400
        }
      });
    }

    // Calculate
    const result = SalaryCalculationEngine.calculateSalesSalary({
      careerStage,
      salesCount,
      referralCount
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVERERROR',
        message: error.message,
        statusCode: 500
      }
    });
  }
};

module.exports = {
  calculateStandardSalary,
  calculateSalesSalary
};
