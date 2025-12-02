/**
 * Tax Configuration
 * Kerala Professional Tax (PT) slabs and other tax-related configuration
 * Reference: Kerala Professional Tax Act for financial year calculations
 */

/**
 * Professional Tax (PT) Slabs for Kerala
 * Applied on gross monthly salary
 * 
 * Slab structure:
 * - Up to ₹10,000: 0%
 * - ₹10,001 to ₹20,000: 1%
 * - ₹20,001 and above: 2% (capped at ₹2,500)
 */
const PT_SLABS = [
  {
    min: 0,
    max: 10000,
    rate: 0,
    description: 'Up to ₹10,000: No PT',
  },
  {
    min: 10001,
    max: 20000,
    rate: 1,
    description: '₹10,001 to ₹20,000: 1% PT',
  },
  {
    min: 20001,
    max: Infinity,
    rate: 2,
    cap: 2500,
    description: '₹20,001+: 2% PT (capped at ₹2,500)',
  },
];

/**
 * Main tax configuration object
 */
const TAX_CONFIG = {
  // Professional Tax
  PT_SLABS,
  
  // PF (Provident Fund) rate
  // Employee contribution: 12% of gross salary
  PF_RATE: 0.12,
  
  // ESI (Employee State Insurance) rate
  // Employee contribution: 0.75% of gross salary
  ESI_RATE: 0.0075,
  
  // ESI is applicable only if gross monthly salary is <= ₹21,000
  ESI_APPLICABLE_LIMIT: 21000,
  
  // TDS (Tax Deducted at Source) configuration
  // For now, basic slabs. Production systems should use actual Indian IT slabs
  INCOME_TAX_SLABS: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 0.05 },
    { min: 500001, max: 1000000, rate: 0.20 },
    { min: 1000001, max: Infinity, rate: 0.30 },
  ],
  
  // Standard deduction for salaried employees (Annual)
  STANDARD_DEDUCTION: 50000,
};

/**
 * Helper function to calculate Professional Tax based on gross salary
 * @param {number} grossSalary - Monthly gross salary
 * @returns {number} Professional Tax amount
 */
function calculateProfessionalTax(grossSalary) {
  if (typeof grossSalary !== 'number' || grossSalary < 0) {
    throw new Error('Gross salary must be a non-negative number');
  }
  
  for (const slab of PT_SLABS) {
    if (grossSalary >= slab.min && grossSalary <= slab.max) {
      let tax = (grossSalary * slab.rate) / 100;
      
      // Apply cap if applicable
      if (slab.cap && tax > slab.cap) {
        tax = slab.cap;
      }
      
      return Math.round(tax * 100) / 100; // Round to 2 decimals
    }
  }
  
  return 0;
}

/**
 * Helper function to calculate PF contribution
 * @param {number} grossSalary - Monthly gross salary
 * @returns {number} PF contribution (employee share)
 */
function calculatePF(grossSalary) {
  if (typeof grossSalary !== 'number' || grossSalary < 0) {
    throw new Error('Gross salary must be a non-negative number');
  }
  
  const pf = (grossSalary * TAX_CONFIG.PF_RATE);
  return Math.round(pf * 100) / 100; // Round to 2 decimals
}

/**
 * Helper function to calculate ESI contribution
 * ESI is applicable only if salary is <= ₹21,000
 * @param {number} grossSalary - Monthly gross salary
 * @returns {number} ESI contribution (employee share)
 */
function calculateESI(grossSalary) {
  if (typeof grossSalary !== 'number' || grossSalary < 0) {
    throw new Error('Gross salary must be a non-negative number');
  }
  
  if (grossSalary > TAX_CONFIG.ESI_APPLICABLE_LIMIT) {
    return 0; // ESI not applicable for salaries above limit
  }
  
  const esi = (grossSalary * TAX_CONFIG.ESI_RATE);
  return Math.round(esi * 100) / 100; // Round to 2 decimals
}

module.exports = {
  TAX_CONFIG,
  PT_SLABS,
  calculateProfessionalTax,
  calculatePF,
  calculateESI,
};
