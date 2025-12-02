const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const Cache = require('node-cache');

// Initialize cache for frequent queries (15 min TTL)
const cache = new Cache({ stdTTL: 900 });

class AIMLService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * SALARY PREDICTION & ANALYSIS
   */
  async predictSalaryAdjustment(employeeData) {
    const cacheKey = `salary_prediction_${employeeData.employeeId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const prompt = `Analyze salary adjustment for this employee:
      Current Salary: ₹${employeeData.currentSalary}
      Experience: ${employeeData.experience} years
      Performance Rating: ${employeeData.performanceRating}/5
      Designation: ${employeeData.designation}
      Market Rate for this role: ₹${employeeData.marketRate}
      Company Growth: ${employeeData.companyGrowth}% YoY
      Inflation Rate: ${employeeData.inflationRate}%
      
      Provide:
      1. Recommended salary increase percentage
      2. New salary range
      3. Justification based on performance & market
      4. Risk factors to consider
      5. Timeline for next review`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      cache.set(cacheKey, response);
      return response;
    } catch (error) {
      logger.error('Salary prediction error:', error);
      throw error;
    }
  }

  /**
   * DOCUMENT GENERATION
   */
  async generateOfferLetter(candidateData) {
    try {
      const prompt = `Generate a professional offer letter in proper format:
      Candidate Name: ${candidateData.name}
      Position: ${candidateData.position}
      Department: ${candidateData.department}
      Salary: ₹${candidateData.salary} CTC
      Joining Date: ${candidateData.joiningDate}
      Location: ${candidateData.location || 'Kochi'}
      Benefits: ${candidateData.benefits || 'Health Insurance, PF, Gratuity'}
      
      Write a formal, professional offer letter that includes:
      1. Job title and responsibilities
      2. Compensation package
      3. Benefits summary
      4. Joining date and location
      5. Standard terms and conditions
      6. Signature line`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Offer letter generation error:', error);
      throw error;
    }
  }

  async generateSalarySlip(employeeData, month) {
    try {
      const prompt = `Generate a comprehensive salary slip summary for ${month}:
      Employee: ${employeeData.name}
      Designation: ${employeeData.designation}
      Department: ${employeeData.department}
      Basic Salary: ₹${employeeData.basicSalary}
      Dearness Allowance: ₹${employeeData.da}
      House Rent Allowance: ₹${employeeData.hra}
      Gross Salary: ₹${employeeData.grossSalary}
      Income Tax: ₹${employeeData.incomeTax}
      Professional Tax (Kerala): ₹${employeeData.professionalTax}
      PF Contribution: ₹${employeeData.pf}
      Total Deductions: ₹${employeeData.totalDeductions}
      Net Salary: ₹${employeeData.netSalary}
      
      Provide:
      1. Professional summary of salary components
      2. YTD (Year To Date) analysis
      3. Tax implications if any
      4. Deduction breakdown explanation
      5. Year-end projections if applicable`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Salary slip generation error:', error);
      throw error;
    }
  }

  /**
   * COMPENSATION ANALYTICS
   */
  async analyzeCompensationParity(departmentData) {
    try {
      const prompt = `Analyze compensation parity and equity for this department:
      ${JSON.stringify(departmentData, null, 2)}
      
      Provide analysis on:
      1. Gender pay gap (if applicable)
      2. Salary compression issues
      3. Outliers in compensation
      4. Recommendations for equity adjustments
      5. Industry benchmarking insights
      6. Risk assessment (legal/compliance)`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Compensation parity analysis error:', error);
      throw error;
    }
  }

  /**
   * TAX OPTIMIZATION ENGINE
   */
  async optimizeTaxStrategy(employeeData) {
    const cacheKey = `tax_optimization_${employeeData.employeeId}_${new Date().getFullYear()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const prompt = `Provide tax optimization strategies for a Kerala-based employee:
      Annual Salary: ₹${employeeData.annualSalary}
      Age: ${employeeData.age}
      Professional Tax Liable: ₹${employeeData.professionalTaxAmount}
      Current Tax Regime: ${employeeData.taxRegime || 'Old'}
      Existing Investments: ${employeeData.investments || 'None'}
      
      Recommend:
      1. Section 80C investments (up to ₹1.5L)
      2. Section 80D health insurance
      3. Section 80E education loan interest
      4. NPS contributions for tax benefit
      5. HRA deduction optimization
      6. Professional tax planning
      7. Comparison: Old vs New Tax Regime
      8. Expected tax savings
      9. Compliance requirements in Kerala
      10. Timeline for implementation`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      cache.set(cacheKey, response);
      return response;
    } catch (error) {
      logger.error('Tax optimization error:', error);
      throw error;
    }
  }

  /**
   * ANOMALY DETECTION & FRAUD PREVENTION
   */
  async detectPayrollAnomalies(payrollData) {
    try {
      const prompt = `Analyze payroll data for anomalies and potential fraud:
      ${JSON.stringify(payrollData, null, 2)}
      
      Check for:
      1. Unusual salary jumps
      2. Duplicate payments
      3. Off-cycle payments
      4. Deduction anomalies
      5. Employee data inconsistencies
      6. Tax calculation errors
      7. Overtime/bonus discrepancies
      8. Resigned employees still in payroll
      9. New joiner processing errors
      10. Professional tax compliance issues
      
      For each finding, provide:
      - Risk level (High/Medium/Low)
      - Description
      - Recommended action
      - Verification steps`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Anomaly detection error:', error);
      throw error;
    }
  }

  /**
   * EMPLOYEE INSIGHTS & ANALYTICS
   */
  async generateEmployeeInsights(employeeHistoricalData) {
    try {
      const prompt = `Generate comprehensive employee insights from this data:
      ${JSON.stringify(employeeHistoricalData, null, 2)}
      
      Analyze:
      1. Career progression trends
      2. Salary growth trajectory
      3. Performance patterns
      4. Department changes and reasons
      5. Attrition risk indicators
      6. Development opportunities
      7. Benchmark against peers
      8. Projected salary in 3-5 years
      9. Retention recommendations
      10. Succession planning insights`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Employee insights error:', error);
      throw error;
    }
  }

  /**
   * PAYROLL COMPLIANCE CHECKER
   */
  async checkComplianceRequirements(organizationData) {
    const cacheKey = `compliance_check_${organizationData.organizationId}_${new Date().getMonth()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const prompt = `Check payroll compliance requirements for Kerala organization:
      Organization: ${organizationData.name}
      Employee Count: ${organizationData.employeeCount}
      Industry: ${organizationData.industry}
      Current Month: ${new Date().toLocaleDateString()}
      
      Provide checklist for:
      1. Kerala Professional Tax compliance
      2. PF (ESIC/EPF) statutory requirements
      3. Income Tax TDS deduction rules
      4. Salary slip preparation requirements
      5. Leave encashment policies
      6. Bonus/gratuity calculations
      7. Annual compliance filings
      8. Employee records maintenance
      9. Payroll audit requirements
      10. Recent regulatory updates
      
      Format as actionable checklist with deadlines`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      cache.set(cacheKey, response);
      return response;
    } catch (error) {
      logger.error('Compliance check error:', error);
      throw error;
    }
  }

  /**
   * PERFORMANCE-BASED RECOMMENDATIONS
   */
  async generatePerformanceRecommendations(employeePerformanceData) {
    try {
      const prompt = `Based on performance data, provide HR recommendations:
      ${JSON.stringify(employeePerformanceData, null, 2)}
      
      Recommend:
      1. Promotion eligibility
      2. Salary increment amount
      3. Bonus/incentive structure
      4. Training & development areas
      5. Role rotation opportunities
      6. Leadership development plan
      7. Retention strategy
      8. Performance improvement plan (if needed)
      9. Skills gaps to address
      10. Career pathing recommendations`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Performance recommendations error:', error);
      throw error;
    }
  }

  /**
   * BULK ANALYSIS
   */
  async analyzeBulkPayroll(payrollList) {
    try {
      const prompt = `Analyze bulk payroll data for insights:
      Employee Count: ${payrollList.length}
      Total Payroll: ₹${payrollList.reduce((sum, p) => sum + p.netSalary, 0)}
      Average Salary: ₹${Math.round(payrollList.reduce((sum, p) => sum + p.grossSalary, 0) / payrollList.length)}
      Departments: ${[...new Set(payrollList.map(p => p.department))].join(', ')}
      
      Provide:
      1. Payroll cost breakdown by department
      2. Salary distribution analysis
      3. Outliers and exceptions
      4. Budget vs actual variance
      5. Cost optimization opportunities
      6. Headcount efficiency metrics
      7. Department-wise compensation trends
      8. Year-over-year comparison insights
      9. Forecast for next quarter
      10. Strategic recommendations`;

      return await this.model.generateContent(prompt);
    } catch (error) {
      logger.error('Bulk payroll analysis error:', error);
      throw error;
    }
  }

  /**
   * MARKET ANALYSIS & BENCHMARKING
   */
  async benchmarkSalaryAgainstMarket(role, location = 'Kochi', experience) {
    const cacheKey = `market_benchmark_${role}_${location}_${experience}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const prompt = `Provide market salary benchmarking data:
      Role: ${role}
      Location: ${location}
      Experience Level: ${experience} years
      
      Research and provide:
      1. Current market salary range
      2. Average compensation package
      3. Percentile analysis (10th, 25th, 50th, 75th, 90th)
      4. Benefits typically offered
      5. Bonus/incentive structures
      6. Growth prospects in this role
      7. Skills that command premium pay
      8. Industry trends affecting this role
      9. Remote work compensation adjustments
      10. Recommendations for competitive positioning`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      cache.set(cacheKey, response);
      return response;
    } catch (error) {
      logger.error('Market benchmarking error:', error);
      throw error;
    }
  }

  /**
   * CLEAR CACHE (for development)
   */
  clearCache() {
    cache.flushAll();
    logger.info('AI/ML cache cleared');
  }
}

module.exports = new AIMLService();
