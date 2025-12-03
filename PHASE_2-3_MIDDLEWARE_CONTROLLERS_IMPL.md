# PHASE 2-3: Middleware & Controller Implementations

## Files to Create

### 1. src/middlewares/correlationId.middleware.js
**Status**: ✅ COMPLETED (see previous commit)

### 2. src/middlewares/validateInput.middleware.js

```javascript
const validator = require('validator');
const logger = require('../config/logger');

/**
 * Input Validation Middleware
 * Validates request data before processing sync operations
 */
const validateEmployee = (req, res, next) => {
  const { firstName, lastName, email, department, employeeCode } = req.body;
  const errors = [];

  // Required fields
  if (!firstName || firstName.trim().length === 0) {
    errors.push('firstName is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.push('lastName is required');
  }
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }
  if (!department || department.trim().length === 0) {
    errors.push('department is required');
  }
  if (!employeeCode || employeeCode.trim().length === 0) {
    errors.push('employeeCode is required');
  }

  // Additional validations
  if (firstName && firstName.length > 50) {
    errors.push('firstName must be less than 50 characters');
  }
  if (lastName && lastName.length > 50) {
    errors.push('lastName must be less than 50 characters');
  }

  if (errors.length > 0) {
    logger.warn('Employee validation failed', {
      correlationId: req.correlationId,
      errors,
      email
    });
    return res.status(400).json({ errors });
  }

  next();
};

const validateAttendance = (req, res, next) => {
  const { employeeId, date, status } = req.body;
  const errors = [];

  if (!employeeId || !validator.isMongoId(employeeId)) {
    errors.push('Valid employeeId is required');
  }
  if (!date || !validator.isISO8601(date)) {
    errors.push('Valid ISO 8601 date is required');
  }
  if (!status || ![' PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'].includes(status)) {
    errors.push('Valid status is required');
  }

  if (errors.length > 0) {
    logger.warn('Attendance validation failed', {
      correlationId: req.correlationId,
      errors
    });
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = { validateEmployee, validateAttendance };
```

### 3. src/middlewares/rateLimit.middleware.js

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client for distributed rate limiting
const redisClient = redis.createClient();

/**
 * Rate Limiting Middleware
 * Protects sync endpoints from abuse
 */
const syncLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:sync:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many sync requests, please try again later',
  keyGenerator: (req) => req.correlationId || req.ip,
  skip: (req) => req.user && req.user.role === 'admin' // Allow admins
});

const employeeLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:employee:'
  }),
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user ? req.user._id : req.ip
});

module.exports = { syncLimiter, employeeLimiter };
```

### 4. src/controllers/employeeController.js (Updated Sections)

**Add these to the createEmployee method:**

```javascript
const ermSyncService = require('../services/erm-sync-fix.service');
const SyncLog = require('../models/SyncLog');
const { v4: uuid } = require('uuid');

exports.createEmployee = async (req, res) => {
  const correlationId = req.correlationId || uuid();
  
  try {
    const employee = new Employee(req.body);
    await employee.save();
    
    // Create sync log entry
    const syncLog = await SyncLog.create({
      sourceSystem: 'HRM',
      targetSystem: 'ERM',
      entityType: 'EMPLOYEE',
      entityId: employee._id,
      operation: 'CREATE',
      status: 'PENDING',
      payload: employee.toObject(),
      correlationId,
      retryCount: 0
    });
    
    // Trigger async sync (fire and forget for now, with error handling)
    ermSyncService.syncEmployee(employee._id, correlationId)
      .catch(err => {
        logger.error('Background sync failed', {
          correlationId,
          employeeId: employee._id,
          error: err.message
        });
      });
    
    res.json({
      success: true,
      data: employee,
      syncId: correlationId
    });
  } catch (err) {
    logger.error('Employee creation failed', {
      correlationId,
      error: err.message
    });
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// New termination endpoint
exports.terminateEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const correlationId = req.correlationId || uuid();
  
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Update employee status
    employee.status = 'TERMINATED';
    employee.terminationDate = new Date();
    await employee.save();
    
    // Cascade termination to ERM
    const syncLog = await ermSyncService.terminateEmployee(
      employeeId,
      req.body.reason,
      correlationId
    );
    
    res.json({
      success: true,
      message: 'Employee terminated',
      data: employee,
      syncId: correlationId
    });
  } catch (err) {
    logger.error('Employee termination failed', {
      correlationId,
      employeeId,
      error: err.message
    });
    res.status(500).json({ error: 'Termination failed' });
  }
};
```

### 5. src/routes/employeeRoutes.js (Updated)

```javascript
const express = require('express');
const employeeController = require('../controllers/employeeController');
const { validateEmployee } = require('../middlewares/validateInput.middleware');
const { employeeLimiter } = require('../middlewares/rateLimit.middleware');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// All employee routes protected by authentication
router.use(auth.protect);

// Apply rate limiting
router.use(employeeLimiter);

// Routes
router.post('/', validateEmployee, employeeController.createEmployee);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', validateEmployee, employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);
router.post('/:employeeId/terminate', employeeController.terminateEmployee);

module.exports = router;
```

### 6. src/models/SyncLog.js (Model Definition)

```javascript
const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  sourceSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true
  },
  targetSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['EMPLOYEE', 'ATTENDANCE', 'ROLE', 'PERMISSION'],
    required: true
  },
  entityId: mongoose.Schema.Types.ObjectId,
  operation: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'TERMINATE'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  payload: mongoose.Schema.Types.Mixed,
  correlationId: String,
  errorMessage: String,
  errorStack: String,
  retryCount: Number,
  attempts: Number,
  duration: Number,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
syncLogSchema.index({ correlationId: 1 });
syncLogSchema.index({ entityId: 1, operation: 1 });
syncLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
```

## Implementation Checklist

- [x] ERM sync service (erm-sync-fix.service.js)
- [x] Correlation ID middleware
- [ ] Validate input middleware - CREATE `src/middlewares/validateInput.middleware.js`
- [ ] Rate limiting middleware - CREATE `src/middlewares/rateLimit.middleware.js`
- [ ] Update employeeController.js with sync emit
- [ ] Create SyncLog model
- [ ] Update employee routes with middlewares
- [ ] Create termination endpoint
- [ ] Integration tests

## Next Steps

1. Create the middleware files in src/middlewares/
2. Update employeeController.js to use sync service
3. Create SyncLog MongoDB model
4. Update routes to include new middlewares and endpoints
5. Test all flows end-to-end
6. Deploy and monitor sync logs
