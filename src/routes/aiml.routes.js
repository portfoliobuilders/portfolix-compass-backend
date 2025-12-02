const express = require('express');
const router = express.Router();
const aimlService = require('../services/aiml.service');
const { authenticate } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ==================== SALARY PREDICTION ====================

/**
 * POST /api/aiml/salary/predict
 * Predict salary adjustment based on employee data
 */
router.post('/salary/predict', authenticate, async (req, res) => {
  try {
    const { employeeId, currentSalary, experience, performanceRating, designation, marketRate, companyGrowth, inflationRate } = req.body;
    
    if (!employeeId || !currentSalary) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const prediction = await aimlService.predictSalaryAdjustment({
      employeeId, currentSalary, experience, performanceRating, designation, marketRate, companyGrowth, inflationRate
    });
    
    res.json({ success: true, prediction });
  } catch (error) {
    logger.error('Salary prediction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DOCUMENT GENERATION ====================

/**
 * POST /api/aiml/documents/offer-letter
 * Generate professional offer letter
 */
router.post('/documents/offer-letter', authenticate, async (req, res) => {
  try {
    const { name, position, department, salary, joiningDate, location, benefits } = req.body;
    
    if (!name || !position || !salary) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const offerLetter = await aimlService.generateOfferLetter({
      name, position, department, salary, joiningDate, location, benefits
    });
    
    res.json({ success: true, offerLetter: offerLetter.response.text() });
  } catch (error) {
    logger.error('Offer letter generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/aiml/documents/salary-slip
 * Generate comprehensive salary slip summary
 */
router.post('/documents/salary-slip', authenticate, async (req, res) => {
  try {
    const { name, designation, department, basicSalary, da, hra, grossSalary, incomeTax, professionalTax, pf, totalDeductions, netSalary, month } = req.body;
    
    if (!name || !grossSalary || !netSalary) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const slip = await aimlService.generateSalarySlip({
      name, designation, department, basicSalary, da, hra, grossSalary, incomeTax, professionalTax, pf, totalDeductions, netSalary
    }, month || new Date().toLocaleDateString());
    
    res.json({ success: true, slip: slip.response.text() });
  } catch (error) {
    logger.error('Salary slip generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COMPENSATION ANALYTICS ====================

/**
 * POST /api/aiml/compensation/parity-analysis
 * Analyze compensation parity and equity
 */
router.post('/compensation/parity-analysis', authenticate, async (req, res) => {
  try {
    const departmentData = req.body;
    
    if (!departmentData || Object.keys(departmentData).length === 0) {
      return res.status(400).json({ success: false, error: 'Department data required' });
    }
    
    const analysis = await aimlService.analyzeCompensationParity(departmentData);
    
    res.json({ success: true, analysis: analysis.response.text() });
  } catch (error) {
    logger.error('Compensation parity analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/aiml/compensation/market-benchmark
 * Benchmark salary against market rates
 */
router.post('/compensation/market-benchmark', authenticate, async (req, res) => {
  try {
    const { role, location = 'Kochi', experience } = req.body;
    
    if (!role || !experience) {
      return res.status(400).json({ success: false, error: 'Role and experience required' });
    }
    
    const benchmark = await aimlService.benchmarkSalaryAgainstMarket(role, location, experience);
    
    res.json({ success: true, benchmark });
  } catch (error) {
    logger.error('Market benchmarking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TAX OPTIMIZATION ====================

/**
 * POST /api/aiml/tax/optimize-strategy
 * Provide tax optimization strategies
 */
router.post('/tax/optimize-strategy', authenticate, async (req, res) => {
  try {
    const { employeeId, annualSalary, age, professionalTaxAmount, taxRegime, investments } = req.body;
    
    if (!employeeId || !annualSalary) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const strategy = await aimlService.optimizeTaxStrategy({
      employeeId, annualSalary, age, professionalTaxAmount, taxRegime, investments
    });
    
    res.json({ success: true, strategy });
  } catch (error) {
    logger.error('Tax optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/aiml/compliance/check
 * Check payroll compliance requirements
 */
router.post('/compliance/check', authenticate, async (req, res) => {
  try {
    const { organizationId, name, employeeCount, industry } = req.body;
    
    if (!organizationId || !name) {
      return res.status(400).json({ success: false, error: 'Organization details required' });
    }
    
    const compliance = await aimlService.checkComplianceRequirements({
      organizationId, name, employeeCount, industry
    });
    
    res.json({ success: true, compliance });
  } catch (error) {
    logger.error('Compliance check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ANOMALY DETECTION ====================

/**
 * POST /api/aiml/payroll/detect-anomalies
 * Detect payroll anomalies and potential fraud
 */
router.post('/payroll/detect-anomalies', authenticate, async (req, res) => {
  try {
    const payrollData = req.body;
    
    if (!payrollData || Object.keys(payrollData).length === 0) {
      return res.status(400).json({ success: false, error: 'Payroll data required' });
    }
    
    const anomalies = await aimlService.detectPayrollAnomalies(payrollData);
    
    res.json({ success: true, anomalies: anomalies.response.text() });
  } catch (error) {
    logger.error('Anomaly detection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== EMPLOYEE INSIGHTS ====================

/**
 * POST /api/aiml/employee/insights
 * Generate comprehensive employee insights
 */
router.post('/employee/insights', authenticate, async (req, res) => {
  try {
    const employeeHistoricalData = req.body;
    
    if (!employeeHistoricalData || Object.keys(employeeHistoricalData).length === 0) {
      return res.status(400).json({ success: false, error: 'Employee data required' });
    }
    
    const insights = await aimlService.generateEmployeeInsights(employeeHistoricalData);
    
    res.json({ success: true, insights: insights.response.text() });
  } catch (error) {
    logger.error('Employee insights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/aiml/employee/performance-recommendations
 * Generate performance-based HR recommendations
 */
router.post('/employee/performance-recommendations', authenticate, async (req, res) => {
  try {
    const employeePerformanceData = req.body;
    
    if (!employeePerformanceData || Object.keys(employeePerformanceData).length === 0) {
      return res.status(400).json({ success: false, error: 'Performance data required' });
    }
    
    const recommendations = await aimlService.generatePerformanceRecommendations(employeePerformanceData);
    
    res.json({ success: true, recommendations: recommendations.response.text() });
  } catch (error) {
    logger.error('Performance recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BULK ANALYSIS ====================

/**
 * POST /api/aiml/payroll/bulk-analysis
 * Analyze bulk payroll data for insights
 */
router.post('/payroll/bulk-analysis', authenticate, async (req, res) => {
  try {
    const payrollList = req.body.payrollList;
    
    if (!Array.isArray(payrollList) || payrollList.length === 0) {
      return res.status(400).json({ success: false, error: 'Payroll list array required' });
    }
    
    const analysis = await aimlService.analyzeBulkPayroll(payrollList);
    
    res.json({ success: true, analysis: analysis.response.text() });
  } catch (error) {
    logger.error('Bulk payroll analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CACHE MANAGEMENT ====================

/**
 * POST /api/aiml/cache/clear
 * Clear AI/ML cache (admin only)
 */
router.post('/cache/clear', authenticate, (req, res) => {
  try {
    // Check if user is admin (you may need to adjust this based on your auth)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    aimlService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/aiml/health
 * Check AI/ML service health
 */
router.get('/health', authenticate, (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'AI/ML with Gemini',
    features: [
      'Salary Prediction',
      'Document Generation',
      'Compensation Analytics',
      'Tax Optimization',
      'Anomaly Detection',
      'Employee Insights',
      'Compliance Checking',
      'Market Benchmarking',
      'Bulk Analysis'
    ],
    timestamp: new Date()
  });
});

module.exports = router;
