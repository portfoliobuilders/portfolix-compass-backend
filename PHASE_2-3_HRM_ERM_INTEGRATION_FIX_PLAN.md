# PHASE 2-3: HRM-ERM Integration Fix Plan

## Overview
This document outlines all critical, high-value, and nice-to-have fixes for HRM-ERM integration based on the comprehensive audit report.

---

## P0 CRITICAL ISSUES - MUST FIX

### P0-HRM-001: Employee Create → ERM Sync Not Implemented
**Issue**: When new employees are created in HRM, they are not automatically synced to ERM system.
**Impact**: ERM lacks employee data, blocking task/achievement management.
**Fix**: Add sync emission to employeeController.js create endpoint.

**Implementation**:
```javascript
// src/controllers/employeeController.js
exports.createEmployee = async (req, res) => {
  const correlationId = req.correlationId || uuid();
  try {
    const employee = new Employee(req.body);
    await employee.save();
    
    // Emit sync event
    await SyncLog.create({
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
    
    // Trigger async sync
    await ermSyncService.syncEmployee(employee._id, correlationId);
    
    res.json({
      success: true,
      data: employee,
      syncId: correlationId
    });
  } catch (err) {
    // Log error with correlation ID
    logger.error('Employee creation failed', {
      correlationId,
      error: err.message,
      trace: err.stack
    });
    res.status(500).json({ error: 'Failed to create employee' });
  }
};
```

### P0-HRM-002: Employee Termination Doesn't Disable ERM Access
**Issue**: When employees are terminated in HRM, their ERM access is not revoked.
**Impact**: Terminated employees can still access ERM system and perform tasks.
**Fix**: Create employee termination endpoint that cascades to ERM.

**Implementation**:
```javascript
// src/controllers/employeeController.js
exports.terminateEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const correlationId = req.correlationId || uuid();
  
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    employee.status = 'TERMINATED';
    employee.terminationDate = new Date();
    await employee.save();
    
    // Create termination sync log
    const syncLog = await SyncLog.create({
      sourceSystem: 'HRM',
      targetSystem: 'ERM',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      operation: 'TERMINATE',
      status: 'PENDING',
      payload: { employeeId, terminationDate: employee.terminationDate },
      correlationId,
      retryCount: 0
    });
    
    // Call ERM termination endpoint
    const ermResult = await axios.post(
      `${process.env.ERM_API_URL}/employees/${employeeId}/terminate`,
      { reason: req.body.reason },
      { headers: { 'X-Correlation-ID': correlationId } }
    );
    
    // Update sync log status
    syncLog.status = 'COMPLETED';
    syncLog.completedAt = new Date();
    await syncLog.save();
    
    res.json({ success: true, message: 'Employee terminated', syncId: correlationId });
  } catch (err) {
    logger.error('Employee termination failed', { correlationId, error: err.message });
    res.status(500).json({ error: 'Termination failed' });
  }
};
```

### P0-HRM-003: Attendance → Payroll Sync Direction Undefined
**Issue**: Unclear which system is source of truth for attendance data.
**Impact**: Data conflicts, duplicate processing, payroll calculation errors.
**Fix**: Define and document sync direction, implement unidirectional sync.

**Implementation**:
```javascript
// src/services/erm-sync-fix.service.js
class ERMSyncService {
  constructor() {
    // DEFINED: HRM is source, ERM is consumer
    this.syncDirection = 'HRM_TO_ERM';
    this.retryConfig = {
      maxRetries: 3,
      backoffMs: 1000,
      timeoutMs: 30000
    };
  }
  
  async syncAttendance(attendanceId, correlationId) {
    const syncLog = await SyncLog.findOne({ entityId: attendanceId });
    if (!syncLog) throw new Error('Sync log not found');
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const attendance = await Attendance.findById(attendanceId);
        const payload = {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: attendance.status,
          source: 'HRM',
          sourceSystemId: attendanceId
        };
        
        await axios.post(
          `${process.env.ERM_API_URL}/attendance/sync`,
          payload,
          {
            headers: {
              'X-Correlation-ID': correlationId,
              'X-Source-System': 'HRM'
            },
            timeout: this.retryConfig.timeoutMs
          }
        );
        
        syncLog.status = 'COMPLETED';
        syncLog.completedAt = new Date();
        await syncLog.save();
        
        logger.info('Attendance synced', { correlationId, attendanceId });
        return syncLog;
      } catch (err) {
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.backoffMs * Math.pow(2, attempt);
          logger.warn(`Sync retry ${attempt + 1}/${this.retryConfig.maxRetries}`, {
            correlationId,
            delay,
            error: err.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          syncLog.status = 'FAILED';
          syncLog.errorMessage = err.message;
          syncLog.retryCount = attempt;
          await syncLog.save();
          throw err;
        }
      }
    }
  }
}

module.exports = new ERMSyncService();
```

### P0-HRM-004: Role/Permission Changes Don't Sync to ERM
**Issue**: Role and permission changes in HRM don't update ERM access controls.
**Impact**: Users retain old permissions in ERM, security risk.
**Fix**: Add role/permission sync to roleController.

**Implementation**:
```javascript
// src/controllers/roleController.js
exports.updateRole = async (req, res) => {
  const { roleId } = req.params;
  const correlationId = req.correlationId || uuid();
  
  try {
    const role = await Role.findByIdAndUpdate(roleId, req.body, { new: true });
    
    const syncLog = await SyncLog.create({
      sourceSystem: 'HRM',
      targetSystem: 'ERM',
      entityType: 'ROLE',
      entityId: roleId,
      operation: 'UPDATE',
      status: 'PENDING',
      payload: role.toObject(),
      correlationId,
      retryCount: 0
    });
    
    // Sync role to ERM
    await axios.put(
      `${process.env.ERM_API_URL}/roles/${roleId}`,
      role.toObject(),
      { headers: { 'X-Correlation-ID': correlationId } }
    );
    
    syncLog.status = 'COMPLETED';
    await syncLog.save();
    
    res.json({ success: true, data: role, syncId: correlationId });
  } catch (err) {
    logger.error('Role update failed', { correlationId, error: err.message });
    res.status(500).json({ error: err.message });
  }
};
```

### P0-ERM-001: No Sync Failure Handling or Retry Logic
**Issue**: Failed syncs are not retried, data loss possible.
**Impact**: Inconsistent state between HRM and ERM.
**Fix**: Implement retry logic in sync service (already shown in P0-HRM-003 fix).

---

## P1 HIGH-VALUE ISSUES - SHOULD FIX

### P1-HRM-005: No Input Validation on ERM Sync Endpoints
**Issue**: ERM sync endpoints lack validation, accepting malformed data.
**Impact**: Corrupted data in both systems.
**Fix**: Add validation middleware.

**Implementation**:
```javascript
// src/middlewares/validateInput.middleware.js
const validateEmployee = (req, res, next) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'department'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  next();
};

module.exports = { validateEmployee };
```

### P1-HRM-006: No Correlation IDs for Debugging
**Issue**: Cannot trace requests across systems for debugging.
**Impact**: Difficult to debug integration issues.
**Fix**: Add correlation ID middleware.

**Implementation**:
```javascript
// src/middlewares/correlationId.middleware.js
const { v4: uuid } = require('uuid');

const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuid();
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  // Attach to logger
  req.logger = logger.child({ correlationId: req.correlationId });
  
  next();
};

module.exports = correlationIdMiddleware;
```

### P1-HRM-007: No Rate Limiting on Endpoints
**Issue**: No protection against sync endpoint abuse.
**Impact**: DDoS vulnerability, service degradation.
**Fix**: Add rate limiting middleware.

**Implementation**:
```javascript
// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

const syncLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many sync requests, please try again later',
  keyGenerator: (req) => req.correlationId || req.ip
});

module.exports = { syncLimiter };
```

---

## P2 NICE-TO-HAVE IMPROVEMENTS

### P2-FE-001: No Offline Sync Queue
**Issue**: Frontend has no offline capability for sync operations.
**Fix**: Add offline queue (implementation for frontend).

### P2-O-001: Sync Logs Not Structured
**Issue**: Sync logs lack structure for analysis.
**Fix**: Implement structured logging.

**Implementation**:
```javascript
// Structured sync logging
logger.info('Employee sync completed', {
  correlationId,
  employeeId,
  duration: endTime - startTime,
  sourceSystem: 'HRM',
  targetSystem: 'ERM',
  operation: 'CREATE',
  status: 'SUCCESS',
  timestamp: new Date().toISOString()
});
```

---

## Implementation Checklist

- [ ] Create `src/services/erm-sync-fix.service.js`
- [ ] Update `src/controllers/employeeController.js` with sync logic
- [ ] Add employee termination endpoint
- [ ] Add role update sync
- [ ] Create `src/middlewares/correlationId.middleware.js`
- [ ] Create `src/middlewares/validateInput.middleware.js`
- [ ] Create `src/middlewares/rateLimit.middleware.js`
- [ ] Update `src/app.js` to register middlewares
- [ ] Create `tests/integration/hrm-erm-sync.test.js`
- [ ] Test all sync flows end-to-end
- [ ] Create deployment checklist

---

## Testing Strategy

### Unit Tests
- ERMSyncService retry logic
- Correlation ID generation
- Input validation

### Integration Tests
- Employee create → ERM sync
- Employee termination cascade
- Role update sync with retry
- Error handling and recovery

### Manual Tests
1. Create employee in HRM, verify in ERM
2. Terminate employee, verify access revoked in ERM
3. Update role permissions, verify in ERM
4. Simulate sync failure, verify retry and recovery

---

## Deployment Steps

1. Deploy middleware updates
2. Deploy service layer updates
3. Deploy controller updates
4. Run integration tests
5. Monitor sync logs for 24 hours
6. Deploy frontend offline queue (separate)

---

## Success Metrics

- 100% sync success rate for employee operations
- <100ms p99 latency for sync operations
- Zero data loss in sync
- All retries successful within 3 attempts
- Complete audit trail with correlation IDs
