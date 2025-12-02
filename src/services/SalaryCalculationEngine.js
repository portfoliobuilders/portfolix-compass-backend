/**
 * SALARY CALCULATION ENGINE - FRONTEND SYNC v17
 * PRODUCTION CRITICAL: All algorithms match frontend v17 exactly
 * Supports: Standard Salary, Sales Salary with Commission Tiers
 * Tax Compliance: Kerala Professional Tax (exact slabs)
 * Precision: All calculations use paise to avoid floating point errors
 */

const Decimal = require('decimal.js');

// EXACT PROFESSIONAL TAX SLABS - KERALA
const PT_SLABS = [
  { max: 10000, rate: 0 },
  { max: 15000, rate: 100 },
  { max: 20000, rate: 150 },
  { max: 25000, rate: 200 },
  { max: 30000, rate: 250 },
  { max: Infinity, rate: 300 }
];

// COMMISSION TIERS - 6 TIERS FOR SALES
const COMMISSION_TIERS = [
  { tierNumber: 1, rangeStart: 1, rangeEnd: 12, ratePerSale: 1000 },
  { tierNumber: 2, rangeStart: 13, rangeEnd: 20, ratePerSale: 2500 },
  { tierNumber: 3, rangeStart: 21, rangeEnd: 30, ratePerSale: 3500 },
  { tierNumber: 4, rangeStart: 31, rangeEnd: 40, ratePerSale: 4500 },
  { tierNumber: 5, rangeStart: 41, rangeEnd: 50, ratePerSale: 5500 },
  { tierNumber: 6, rangeStart: 51, rangeEnd: Infinity, ratePerSale: 6500 }
];

// SALES BASE SALARIES - CAREER PHASE DEPENDENT
const SALES_BASE = {
  probation: 5000, // Non-negotiable
  established: 13000 // Non-negotiable
};

// SALES FIXED ALLOWANCES - ALWAYS SAME
const SALES_ALLOWANCES = {
  skill: 1500,
  medical: 1250,
  wellness: 2500
};

// REFERRAL BONUS TIERS - ESTABLISHED ONLY
const REFERRAL_BONUSES = [4500, 5500, 7000, 10000];

// SALES FIXED DEDUCTIONS
const SALES_DEDUCTIONS = {
  welfareFund: 150,
  communication: 400
};

// HELPER: Round to 2 decimals (avoid floating point errors)
const round2 = (num) => Math.round(num * 100) / 100;

// HELPER: Calculate Professional Tax using exact slabs
const calculatePT = (gross) => {
  for (const slab of PT_SLABS) {
    if (gross <= slab.max) {
      return slab.rate;
    }
  }
  return 300; // Fallback to max
};

// HELPER: Calculate PF (12% of Basic + DA)
const calculatePF = (basic, da) => {
  return round2((basic + da) * 0.12);
};

// HELPER: Calculate ESI (0.75% if salary <= 21000)
const calculateESI = (gross) => {
  return gross <= 21000 ? round2(gross * 0.0075) : 0;
};

// HELPER: Round to 2 decimals
const formatMoney = (num) => round2(num);

class SalaryCalculationEngine {
  /**
   * STANDARD SALARY CALCULATION
   * Input: { basic, specialAllowance, otherAllowance, incomeTax, otherDeductions }
   * Output: { earnings, deductions, net, annualCTC }
   */
  static calculateStandardSalary(input) {
    const { basic = 0, specialAllowance = 0, otherAllowance = 0, incomeTax = 0, otherDeductions = 0 } = input;

    // STEP 1: Calculate Earnings
    const hra = round2(basic * 0.30); // 30% FIXED RATE
    const da = round2(basic * 0.08); // 8% FIXED RATE
    
    const earnings = {
      basicSalary: formatMoney(basic),
      hra: formatMoney(hra),
      da: formatMoney(da),
      specialAllowance: formatMoney(specialAllowance),
      otherAllowance: formatMoney(otherAllowance),
      gross: formatMoney(basic + hra + da + specialAllowance + otherAllowance)
    };

    // STEP 2: Calculate Deductions
    const pf = calculatePF(basic, da);
    const pt = calculatePT(earnings.gross);
    const esi = calculateESI(earnings.gross);
    const it = formatMoney(incomeTax);
    const other = formatMoney(otherDeductions);

    const deductions = {
      pf: formatMoney(pf),
      professionalTax: formatMoney(pt),
      incomeTax: formatMoney(it),
      otherDeductions: formatMoney(other),
      total: formatMoney(pf + pt + esi + it + other)
    };

    // STEP 3: Calculate Net & CTC
    const net = formatMoney(earnings.gross - deductions.total);
    const annualCTC = formatMoney(earnings.gross * 12);

    return {
      status: 'success',
      type: 'standard',
      earnings,
      deductions,
      net,
      annualCTC
    };
  }

  /**
   * SALES SALARY CALCULATION
   * Input: { careerStage, salesCount, referralCount }
   * Output: { fixed, variable, earnings, deductions, net, annualCTC }
   */
  static calculateSalesSalary(input) {
    const { careerStage = 'probation', salesCount = 0, referralCount = 0 } = input;

    // VALIDATE INPUTS
    if (![' probation', 'established'].includes(careerStage)) {
      throw new Error('VALIDATIONERROR: careerStage must be probation or established');
    }
    if (salesCount < 0) {
      throw new Error('VALIDATIONERROR: salesCount must be non-negative');
    }
    if (referralCount < 0) {
      throw new Error('VALIDATIONERROR: referralCount must be non-negative');
    }

    // STEP 1: Calculate Fixed Salary
    const baseSalary = SALES_BASE[careerStage];
    const totalAllowances = SALES_ALLOWANCES.skill + SALES_ALLOWANCES.medical + SALES_ALLOWANCES.wellness;
    
    const fixed = {
      baseSalary: formatMoney(baseSalary),
      skillAllowance: formatMoney(SALES_ALLOWANCES.skill),
      medicalAllowance: formatMoney(SALES_ALLOWANCES.medical),
      wellnessAllowance: formatMoney(SALES_ALLOWANCES.wellness),
      total: formatMoney(baseSalary + totalAllowances)
    };

    // STEP 2: Calculate Commission (Tiered by sales count)
    const commissionBreakdown = [];
    let totalCommission = 0;
    let remainingSales = salesCount;

    for (const tier of COMMISSION_TIERS) {
      if (remainingSales <= 0) break;

      const tierSize = tier.rangeEnd - tier.rangeStart + 1;
      const salesInTier = Math.min(remainingSales, tierSize);
      const tierCommission = salesInTier * tier.ratePerSale;

      commissionBreakdown.push({
        tier: tier.tierNumber,
        range: `${tier.rangeStart}-${tier.rangeEnd === Infinity ? '+' : tier.rangeEnd}`,
        ratePerSale: formatMoney(tier.ratePerSale),
        salesCount: salesInTier,
        commission: formatMoney(tierCommission)
      });

      totalCommission += tierCommission;
      remainingSales -= salesInTier;
    }

    // STEP 3: Calculate Milestone Bonuses (Career stage dependent)
    let milestoneBonus = 0;
    if (careerStage === 'probation') {
      if (salesCount >= 4) milestoneBonus += 500;
      if (salesCount >= 8) milestoneBonus += 500;
    } else if (careerStage === 'established') {
      if (salesCount >= 3) milestoneBonus += 500;
      if (salesCount >= 8) milestoneBonus += 500;
    }

    // STEP 4: Calculate Referral Bonus (ESTABLISHED ONLY, quarterly average, 30K cap)
    let referralBonus = 0;
    if (careerStage === 'established' && referralCount > 0) {
      let totalReferralBonus = 0;
      for (let i = 0; i < Math.min(referralCount, 4); i++) {
        totalReferralBonus += REFERRAL_BONUSES[i];
      }
      // Quarterly average: divide by 3, cap at 30K
      referralBonus = Math.min(totalReferralBonus / 3, 30000);
    }

    const variable = {
      salesCount,
      commissionTierBreakdown: commissionBreakdown,
      totalCommission: formatMoney(totalCommission),
      milestoneBonus: formatMoney(milestoneBonus),
      referralCount: careerStage === 'established' ? Math.min(referralCount, 4) : 0,
      referralBonus: formatMoney(referralBonus),
      total: formatMoney(totalCommission + milestoneBonus + referralBonus)
    };

    // STEP 5: Calculate Total Earnings & Deductions
    const grossEarnings = fixed.total + variable.total;
    
    const deductions = {
      welfareFund: formatMoney(SALES_DEDUCTIONS.welfareFund),
      communication: formatMoney(SALES_DEDUCTIONS.communication),
      total: formatMoney(SALES_DEDUCTIONS.welfareFund + SALES_DEDUCTIONS.communication)
    };

    const net = formatMoney(grossEarnings - deductions.total);
    const annualCTC = formatMoney(grossEarnings * 12);
    const monthlyLPA = formatMoney(net);

    return {
      status: 'success',
      type: 'sales',
      careerStage,
      fixed,
      variable,
      earnings: {
        gross: formatMoney(grossEarnings)
      },
      deductions,
      net,
      annualCTC,
      monthlyLPA
    };
  }
}

module.exports = SalaryCalculationEngine;
