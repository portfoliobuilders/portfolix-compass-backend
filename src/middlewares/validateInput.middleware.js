const validator = require('validator');
const logger = require('../config/logger');

/**
 * Input Validation Middleware
 * Validates employee and attendance data before processing sync operations
 * Fixes P1-HRM-005: No input validation on ERM sync endpoints
 */

const validateEmployee = (req, res, next) => {
  const { firstName, lastName, email, department, employeeCode, designation, joinDate } = req.body;
  const errors = [];

  // Required fields validation
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    errors.push('firstName is required and must be a non-empty string');
  }
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    errors.push('lastName is required and must be a non-empty string');
  }
  if (!email) {
    errors.push('email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('email must be a valid email address');
  }
  if (!department || typeof department !== 'string' || department.trim().length === 0) {
    errors.push('department is required');
  }
  if (!employeeCode || typeof employeeCode !== 'string' || employeeCode.trim().length === 0) {
    errors.push('employeeCode is required');
  }

  // Optional field: designation
  if (designation && typeof designation !== 'string') {
    errors.push('designation must be a string');
  }

  // Optional field: joinDate
  if (joinDate && !validator.isISO8601(joinDate)) {
    errors.push('joinDate must be a valid ISO 8601 date');
  }

  // Length validations
  if (firstName && firstName.length > 100) {
    errors.push('firstName must be less than 100 characters');
  }
  if (lastName && lastName.length > 100) {
    errors.push('lastName must be less than 100 characters');
  }
  if (email && email.length > 255) {
    errors.push('email must be less than 255 characters');
  }
  if (employeeCode && employeeCode.length > 50) {
    errors.push('employeeCode must be less than 50 characters');
  }

  // Email already exists check (basic)
  if (email && !validator.isEmail(email)) {
    // isEmail already checked above, this is redundant but explicit
  }

  if (errors.length > 0) {
    logger.warn('Employee validation failed', {
      correlationId: req.correlationId,
      errors,
      email,
      employeeCode
    });
    return res.status(400).json({ 
      success: false,
      errors,
      correlationId: req.correlationId 
    });
  }

  // Sanitize inputs
  req.body.firstName = validator.trim(firstName);
  req.body.lastName = validator.trim(lastName);
  req.body.email = validator.normalizeEmail(email);
  req.body.department = validator.trim(department);
  req.body.employeeCode = validator.trim(employeeCode);

  next();
};

const validateAttendance = (req, res, next) => {
  const { employeeId, date, status, checkInTime, checkOutTime } = req.body;
  const errors = [];

  // Required fields
  if (!employeeId) {
    errors.push('employeeId is required');
  } else if (!validator.isMongoId(employeeId)) {
    errors.push('employeeId must be a valid MongoDB ID');
  }

  if (!date) {
    errors.push('date is required');
  } else if (!validator.isISO8601(date)) {
    errors.push('date must be a valid ISO 8601 date (YYYY-MM-DD)');
  }

  if (!status) {
    errors.push('status is required');
  } else if (!['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'ON_DUTY'].includes(status)) {
    errors.push('status must be one of: PRESENT, ABSENT, LEAVE, HALF_DAY, ON_DUTY');
  }

  // Optional fields with validation
  if (checkInTime && !validator.isISO8601(checkInTime)) {
    errors.push('checkInTime must be a valid ISO 8601 datetime');
  }

  if (checkOutTime && !validator.isISO8601(checkOutTime)) {
    errors.push('checkOutTime must be a valid ISO 8601 datetime');
  }

  // Check that checkIn and checkOut times are in order
  if (checkInTime && checkOutTime) {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    if (checkIn >= checkOut) {
      errors.push('checkOutTime must be after checkInTime');
    }
  }

  if (errors.length > 0) {
    logger.warn('Attendance validation failed', {
      correlationId: req.correlationId,
      errors,
      employeeId,
      date,
      status
    });
    return res.status(400).json({ 
      success: false,
      errors,
      correlationId: req.correlationId 
    });
  }

  // Sanitize
  req.body.date = validator.trim(date);
  req.body.status = validator.trim(status);

  next();
};

const validateRole = (req, res, next) => {
  const { name, permissions, description } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  if (name && name.length > 100) {
    errors.push('name must be less than 100 characters');
  }

  if (permissions && !Array.isArray(permissions)) {
    errors.push('permissions must be an array');
  }

  if (permissions && permissions.length > 0) {
    permissions.forEach((perm, index) => {
      if (typeof perm !== 'string') {
        errors.push(`permissions[${index}] must be a string`);
      }
    });
  }

  if (description && typeof description !== 'string') {
    errors.push('description must be a string');
  }

  if (description && description.length > 500) {
    errors.push('description must be less than 500 characters');
  }

  if (errors.length > 0) {
    logger.warn('Role validation failed', {
      correlationId: req.correlationId,
      errors,
      roleName: name
    });
    return res.status(400).json({ 
      success: false,
      errors,
      correlationId: req.correlationId 
    });
  }

  req.body.name = validator.trim(name);
  next();
};

module.exports = {
  validateEmployee,
  validateAttendance,
  validateRole
};
