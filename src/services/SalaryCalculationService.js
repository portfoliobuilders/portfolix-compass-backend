/**
 * Salary Calculation Service
 * Core engine for calculating standard and sales salaries
 * Supports multi-tenant, accurate financial calculations with no floating point errors
 */

const { SALARY_TYPES, CAREER_STAGES } = require('../config/constants');
const { calculateProfessionalTax, calculatePF, calculateESI } = require('../config/taxConfig');

class SalaryCalculationService {
  /**
   * Calculate complete salary breakdown for an employee
   * Supports both STANDARD and SALES salary types
   */
  static calculateSalary(employee, salaryStructure, month) {
    if (salaryStructure.salaryType === SALARY_TYPES.STANDARD) {
      return this.calculateStandardSalary(salaryStructure, month);
    } else if (salaryStructure.salaryType === SALARY_TYPES.SALES) {
      return this.calculateSalesSalary(salaryStructure, employee, month);
    }
    throw new Error(`Unknown salary type: ${salaryStructure.salaryType}`);
  }

  /**
   * STANDARD SALARY CALCULATION
   * Formula: Basic + HRA + DA + Allowances - PF - PT - ESI - IT
   */
  static calculateStandardSalary(salaryStructure, month) {
    // Basic components (in paise to avoid floating point)
    const basic = Math.round(salaryStructure.basicSalary * 100);
    const hra = Math.round((salaryStructure.hra || 0) * 100);
    const da = Math.round((salaryStructure.da || 0) * 100);
    const allowances = Math.round((salaryStructure.allowances || 0) * 100);

    const gross = basic + hra + da + allowances;

    // Deductions
    const pf = Math.round((gross / 100) * 12); // 12% PF
    const pt = Math.round(calculateProfessionalTax(gross / 100) * 100);
    const esi = Math.round(calculateESI(gross / 100) * 100);
    const it = salaryStructure.incomeTax ? Math.round(salaryStructure.incomeTax * 100) : 0;

    const totalDeductions = pf + pt + esi + it;
    const net = gross - totalDeductions;

    return {
      salaryType: SALARY_TYPES.STANDARD,
      components: {
        basic: basic / 100,
        hra: hra / 100,
        da: da / 100,
        allowances: allowances / 100,
        gross: gross / 100,
      },
      deductions: {
        pf: pf / 100,
        pt: pt / 100,
        esi: esi / 100,
        incomeTax: it / 100,
        totalDeductions: totalDeductions / 100,
      },
      net: net / 100,
      month,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * SALES SALARY CALCULATION
   * Formula: Fixed + Commission (Tiered) + Bonuses + Referral Bonus - Deductions
   */
  static calculateSalesSalary(salaryStructure, employee, month) {
    // Fixed component
    const basicSalary = Math.round(salaryStructure.basicSalary * 100);
    const allowances = Math.round((salaryStructure.allowances || 0) * 100);
    const fixedSalary = basicSalary + allowances;

    // Commission calculation (tiered by sales count)
    const salesCount = employee.salesPerformance?.salesCount || 0;
    const commissionTiers = salaryStructure.commissionTiers || [];
    let commission = 0;

    for (const tier of commissionTiers) {
      if (salesCount >= tier.salesCountFrom && salesCount <= tier.salesCountTo) {
        commission = Math.round((tier.commissionAmount || 0) * salesCount * 100);
        break;
      }
    }

    // Milestone bonuses (based on career stage)
    let milestoneBonus = 0;
    const careerStage = salaryStructure.careerStage || CAREER_STAGES.PROBATION;
    
    if (careerStage === CAREER_STAGES.PROBATION) {
      if (salesCount >= 4) milestoneBonus += Math.round(1000 * 100); // 1K at 4th
      if (salesCount >= 8) milestoneBonus += Math.round(2000 * 100); // 2K at 8th
    } else if (careerStage === CAREER_STAGES.ESTABLISHED) {
      if (salesCount >= 3) milestoneBonus += Math.round(1500 * 100); // 1.5K at 3rd
      if (salesCount >= 8) milestoneBonus += Math.round(2500 * 100); // 2.5K at 8th
    }

    // Referral bonuses (up to 4 referrals, capped at 30K/month)
    let referralBonus = 0;
    const referrals = employee.referrals || [];
    const referralAmounts = [
      Math.round(5000 * 100),    // 1st referral: 5K
      Math.round(7500 * 100),    // 2nd referral: 7.5K
      Math.round(10000 * 100),   // 3rd referral: 10K
      Math.round(7500 * 100),    // 4th referral: 7.5K
    ];

    for (let i = 0; i < Math.min(referrals.length, 4); i++) {
      referralBonus += referralAmounts[i];
    }

    // Cap referral bonus at 30K/month
    referralBonus = Math.min(referralBonus, Math.round(30000 * 100));

    const gross = fixedSalary + commission + milestoneBonus + referralBonus;

    // Deductions
    const pf = Math.round((gross / 100) * 12); // 12% PF
    const pt = Math.round(calculateProfessionalTax(gross / 100) * 100);
    const esi = Math.round(calculateESI(gross / 100) * 100);
    const it = salaryStructure.incomeTax ? Math.round(salaryStructure.incomeTax * 100) : 0;

    const totalDeductions = pf + pt + esi + it;
    const net = gross - totalDeductions;

    return {
      salaryType: SALARY_TYPES.SALES,
      components: {
        fixed: fixedSalary / 100,
        basicSalary: basicSalary / 100,
        allowances: allowances / 100,
        commission: commission / 100,
        milestoneBonus: milestoneBonus / 100,
        referralBonus: referralBonus / 100,
        gross: gross / 100,
      },
      deductions: {
        pf: pf / 100,
        pt: pt / 100,
        esi: esi / 100,
        incomeTax: it / 100,
        totalDeductions: totalDeductions / 100,
      },
      performance: {
        salesCount,
        referralCount: Math.min(referrals.length, 4),
      },
      net: net / 100,
      month,
      careerStage,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate salary structure before calculation
   */
  static validateSalaryStructure(salaryStructure) {
    if (!salaryStructure.basicSalary || salaryStructure.basicSalary <= 0) {
      throw new Error('Basic salary must be greater than 0');
    }

    if (!salaryStructure.salaryType || 
        ![SALARY_TYPES.STANDARD, SALARY_TYPES.SALES].includes(salaryStructure.salaryType)) {
      throw new Error(`Invalid salary type. Must be ${SALARY_TYPES.STANDARD} or ${SALARY_TYPES.SALES}`);
    }

    return true;
  }

  /**
   * Calculate CTC (Cost to Company) for offer letters
   * CTC = Gross + Employer PF + Employer ESI
   */
  static calculateCTC(salary) {
    const employerPF = salary.components.gross * 0.12; // Employer contribution 12%
    const employerESI = salary.salary.deductions.esi > 0 ? salary.components.gross * 0.0325 : 0; // Employer ESI 3.25%
    const ctc = salary.components.gross + employerPF + employerESI;
    return Math.round(ctc * 100) / 100;
  }
}

module.exports = SalaryCalculationService;
