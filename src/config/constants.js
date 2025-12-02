/**
 * Application Constants
 * Centralized configuration for roles, statuses, enums, and error codes
 */

// Role definitions for RBAC
const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  FINANCE: 'FINANCE',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
};

// Salary type enum
const SALARY_TYPES = {
  STANDARD: 'STANDARD',
  SALES: 'SALES',
};

// Career stage enum
const CAREER_STAGES = {
  PROBATION: 'PROBATION',
  ESTABLISHED: 'ESTABLISHED',
};

// Payroll record status workflow
const PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  CALCULATED: 'CALCULATED',
  APPROVED: 'APPROVED',
  PROCESSED: 'PROCESSED',
  PAID: 'PAID',
  ARCHIVED: 'ARCHIVED',
};

// Offer letter status workflow
const OFFER_LETTER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

// Employee status
const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  INACTIVE: 'INACTIVE',
  TERMINATED: 'TERMINATED',
};

// Error codes for standardized error responses
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  CONFLICT: 'CONFLICT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_OPERATION: 'INVALID_OPERATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// JWT configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
};

// Commission milestone bonuses for sales (probation vs established)
const COMMISSION_MILESTONES = {
  PROBATION: {
    4: 1000,   // ₹1000 at 4th sale
    8: 2000,   // ₹2000 at 8th sale
  },
  ESTABLISHED: {
    3: 1500,   // ₹1500 at 3rd sale
    8: 2500,   // ₹2500 at 8th sale
  },
};

// Referral bonus tiers (up to 4 referrals)
const REFERRAL_BONUSES = [
  { tier: 1, amount: 5000 },
  { tier: 2, amount: 7500 },
  { tier: 3, amount: 10000 },
  { tier: 4, amount: 7500 },
];

const REFERRAL_BONUS_CAP = 30000; // Maximum referral bonus per month

// Message templates
const MESSAGE_TEMPLATES = {
  SALARY_SLIP_GENERATED: 'Salary slip generated successfully',
  PAYROLL_APPROVED: 'Payroll approved successfully',
  PAYROLL_PROCESSED: 'Payroll processed successfully',
  OFFER_LETTER_SENT: 'Offer letter sent successfully',
};

module.exports = {
  ROLES,
  SALARY_TYPES,
  CAREER_STAGES,
  PAYROLL_STATUS,
  OFFER_LETTER_STATUS,
  EMPLOYEE_STATUS,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION,
  JWT_CONFIG,
  COMMISSION_MILESTONES,
  REFERRAL_BONUSES,
  REFERRAL_BONUS_CAP,
  MESSAGE_TEMPLATES,
};
