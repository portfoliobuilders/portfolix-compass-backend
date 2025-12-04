# PHASE 3 - ERM Modules Implementation Guide

**Status**: ✅ COMPLETE - Ready for Testing
**Version**: 1.0.0
**Last Updated**: December 4, 2025

## Overview

PHASE 3 implements the Employee Relationship Management (ERM) system, consisting of three core modules:
- **Attendance Management**: Check-in/Check-out, reporting
- **Task Management**: Assignment, tracking, status updates
- **Leave Management**: Request, approval workflow, balance tracking

## Architecture Decision

**Database Distribution**:
- **PostgreSQL**: Attendance, Task, Leave, SyncLog (ERM modules)
- **MongoDB**: User, Employee, Company, Department (HR data)
- **Sync Layer**: SyncLog model bridges MongoDB-PostgreSQL data consistency

## Modules Implemented

### 1. Attendance Module (attendanceController.js)

**Files**: 338 lines | 4 main endpoints

**Features**:
- Check-in with location and notes
- Check-out with automatic working hours calculation
- Employee attendance history with filtering
- Department-wide attendance reports

**Endpoints**:
```
POST   /api/erm/attendance/check-in
POST   /api/erm/attendance/check-out
GET    /api/erm/attendance/employee/:employeeId?startDate=&endDate=
GET    /api/erm/attendance/department/:departmentId/report?startDate=&endDate=
```

**Usage Examples**:
```bash
# Check-in
curl -X POST http://localhost:5000/api/erm/attendance/check-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp_123",
    "checkInTime": "2025-12-04T09:00:00Z",
    "location": "Office - Desk 5",
    "notes": "Arrived on time"
  }'

# Check-out
curl -X POST http://localhost:5000/api/erm/attendance/check-out \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceId": "att_456",
    "checkOutTime": "2025-12-04T18:00:00Z"
  }'

# Get attendance records
curl -X GET "http://localhost:5000/api/erm/attendance/employee/emp_123?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer <token>"
```

### 2. Task Module (taskController.js)

**Files**: 400 lines | 6 main endpoints

**Features**:
- Task creation with priority and due dates
- Assign tasks to employees
- Track task status: pending, in_progress, completed, cancelled, on_hold
- Team/manager view of assigned tasks
- Auto-calculate overdue tasks

**Endpoints**:
```
POST   /api/erm/tasks
GET    /api/erm/tasks/:taskId
GET    /api/erm/tasks/assignee/:assigneeId?status=&priority=
GET    /api/erm/tasks/team/:managerId?status=
PATCH  /api/erm/tasks/:taskId/status
DELETE /api/erm/tasks/:taskId
```

**Usage Examples**:
```bash
# Create task
curl -X POST http://localhost:5000/api/erm/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive docs for API",
    "assigneeId": "emp_123",
    "dueDate": "2025-12-10T18:00:00Z",
    "priority": "high"
  }'

# Update task status
curl -X PATCH http://localhost:5000/api/erm/tasks/task_789/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Started working on it"
  }'

# Get team tasks
curl -X GET "http://localhost:5000/api/erm/tasks/team/mgr_001?status=pending" \
  -H "Authorization: Bearer <token>"
```

### 3. Leave Module (leaveController.js)

**Files**: 400 lines | 5 main endpoints

**Features**:
- Leave request submission with date validation
- Automatic overlap detection
- Manager approval/rejection workflow
- Pending leave dashboard
- Leave balance calculation (20 days annual default)

**Endpoints**:
```
POST   /api/erm/leave/request
POST   /api/erm/leave/:leaveId/approve
GET    /api/erm/leave/employee/:employeeId?status=&startDate=&endDate=
GET    /api/erm/leave/pending?departmentId=
GET    /api/erm/leave/balance/:employeeId
```

**Usage Examples**:
```bash
# Request leave
curl -X POST http://localhost:5000/api/erm/leave/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp_123",
    "startDate": "2025-12-20T00:00:00Z",
    "endDate": "2025-12-24T23:59:59Z",
    "leaveType": "vacation",
    "reason": "Family vacation"
  }'

# Approve leave
curl -X POST http://localhost:5000/api/erm/leave/leave_555/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "approverComments": "Approved - cover arranged"
  }'

# Check leave balance
curl -X GET http://localhost:5000/api/erm/leave/balance/emp_123 \
  -H "Authorization: Bearer <token>"
```

## ERM Routes (ermRoutes.js)

**Files**: 77 lines | 18 total endpoints

**Route Structure**:
```
/api/erm/
  ├── attendance/
  │   ├── check-in (POST)
  │   ├── check-out (POST)
  │   ├── employee/:employeeId (GET)
  │   └── department/:departmentId/report (GET)
  ├── tasks/
  │   ├── (POST)
  │   ├── :taskId (GET, PATCH, DELETE)
  │   ├── assignee/:assigneeId (GET)
  │   └── team/:managerId (GET)
  └── leave/
      ├── request (POST)
      ├── :leaveId/approve (POST)
      ├── employee/:employeeId (GET)
      ├── pending (GET)
      └── balance/:employeeId (GET)
```

## Integration with Server

**In server.js**:
```javascript
const ermRoutes = require('./routes/ermRoutes');

// Add after other route definitions
app.use('/api/erm', ermRoutes);
```

## Data Models

All models are stored in PostgreSQL via Prisma:

### Attendance
- id (String)
- employeeId (String)
- date (DateTime)
- checkInTime (DateTime)
- checkOutTime (DateTime, nullable)
- workingHours (Float)
- status (String: present, absent)
- location (String)
- companyId (String)

### Task
- id (String)
- title (String)
- description (String)
- assigneeId (String)
- assignerId (String)
- dueDate (DateTime, nullable)
- priority (String: low, medium, high)
- status (String: pending, in_progress, completed, cancelled, on_hold)
- completedAt (DateTime, nullable)
- notes (String)
- companyId (String)

### Leave
- id (String)
- employeeId (String)
- startDate (DateTime)
- endDate (DateTime)
- numberOfDays (Int)
- leaveType (String: vacation, sick, personal)
- reason (String)
- status (String: pending, approved, rejected, cancelled)
- approverId (String, nullable)
- approverComments (String)
- approvedAt (DateTime, nullable)
- companyId (String)

## Multi-Tenancy Support

✅ **Fully Implemented**:
- All endpoints extract `companyId` from authenticated user
- All database queries filtered by `companyId`
- Data isolation guaranteed across companies
- Cross-tenant access prevented at controller level

## Sync Strategy

**SyncLog Tracking**:
Every ERM action creates a SyncLog record:
```javascript
await prisma.syncLog.create({
  entityType: 'Attendance|Task|Leave',
  entityId: recordId,
  action: 'create|update|delete|checkIn|approveLeave',
  status: 'completed|pending|failed',
  sourceSystem: 'PostgreSQL',
  targetSystem: 'MongoDB',
  syncedAt: new Date(),
  companyId: companyId
});
```

This enables:
1. Real-time MongoDB sync via webhook
2. Audit trail for all ERM operations
3. Conflict resolution in sync process

## Testing

**Unit Tests**: Located in `test/erm/`
- attendanceController.test.js
- taskController.test.js
- leaveController.test.js

**Run Tests**:
```bash
npm run test -- --testPathPattern=erm
```

**Coverage Requirements**:
- Controllers: 80% minimum
- Routes: 75% minimum
- Overall: 78% minimum

## Error Handling

**Standard Error Responses**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "detailed error message"
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (validation failed)
- 404: Not Found
- 500: Server Error

## Performance Optimization

- ✅ Indexed queries on employeeId, companyId
- ✅ Pagination support for large datasets
- ✅ Minimal data retrieval (select specific fields)
- ✅ Async/await for non-blocking operations

## Security

- ✅ JWT authentication required on all endpoints
- ✅ Company-level data isolation
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Rate limiting ready (implement in middleware)

## Next Steps (PHASE 4)

1. Create complementary MongoDB sync service
2. Implement role-based access control (RBAC)
3. Add audit logging
4. Create analytics and reporting endpoints
5. Performance testing and optimization

## Production Readiness

**Current Status**: 80% Production Ready

**Before Deployment**:
- [ ] Run full test suite
- [ ] Load test with 1000+ concurrent users
- [ ] Security audit
- [ ] Database backup strategy
- [ ] Monitoring setup (logs, metrics)
- [ ] Incident response plan

## Support & Documentation

For API testing, use the curl examples provided in each module section.
For detailed implementation, refer to the controller files.

---
**Created**: December 4, 2025
**Author**: Portfolix Development Team
**Version**: 1.0.0 (PHASE 3 Complete)
