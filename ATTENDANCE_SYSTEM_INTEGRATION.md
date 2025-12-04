# Attendance System Integration Guide

## Overview
This document maps your existing **Attendance User Model** with the newly created **ERM Models** (Attendance, Task, Leave) in Portfolix Compass backend to enable bidirectional data synchronization.

**Your System:** MongoDB-based attendance tracking with work sessions, check-in/out, achievements, and tasks  
**New ERM System:** Portable, multi-tenant HR management module with standardized schemas

---

## Data Model Mapping

### 1. User Model → Attendance Model Mapping

#### Your Current Structure (User.ts):
```typescript
workSessions: [
  {
    checkInTime: Date,
    checkOutTime: Date,
    hoursWorked: Number,
    assignedLocation: ObjectId,
    locationName: String,
    status: 'ontime' | 'late'
  }
],
totalHoursWorked: Number,
checkInTime: Date,
checkOutTime: Date,
```

#### New ERM Structure (Attendance.js):
```javascript
{
  companyId: ObjectId,      // Maps to: your employee's company
  employeeId: ObjectId,     // Maps to: User._id
  date: Date,              // Maps to: workSession.checkInTime date
  checkInTime: Date,       // Maps to: workSession.checkInTime
  checkOutTime: Date,      // Maps to: workSession.checkOutTime
  workHours: Number,       // Maps to: workSession.hoursWorked
  status: 'Present' | 'Absent' | 'Late',  // Maps to: workSession.status
  notes: String,           // Maps to: optional location notes
}
```

**Integration Strategy:**
```javascript
// When user checks in (existing system)
const workSession = user.workSessions[user.workSessions.length - 1];

// Create Attendance record in ERM
const attendanceRecord = await Attendance.create({
  companyId: user.companyId,
  employeeId: user._id,
  date: new Date(workSession.checkInTime).toDateString(),
  checkInTime: workSession.checkInTime,
  checkOutTime: workSession.checkOutTime,
  workHours: workSession.hoursWorked,
  status: workSession.status === 'late' ? 'Late' : 'Present',
  notes: `Location: ${workSession.locationName}`
});

// Update user's totalHoursWorked from ERM
user.totalHoursWorked = (await Attendance.aggregate([
  { $match: { employeeId: user._id } },
  { $group: { _id: null, total: { $sum: '$workHours' } } }
]))[0]?.total || 0;
```

---

### 2. User Model → Task Model Mapping

#### Your Current Structure:
```typescript
todaysAchievements: [String],      // Daily accomplishments
pendingTasks: [String],             // Tasks to complete
achievementHistory: [
  {
    achievement: String,
    date: Date
  }
],
todoHistory: [
  {
    date: Date,
    todaysAchievements: [String],
    pendingTasks: [String]
  }
]
```

#### New ERM Structure (Task.js):
```javascript
{
  companyId: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId,     // Maps to: User._id
  assignedBy: ObjectId,     // Maps to: manager/admin
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold',
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  dueDate: Date,
  completedAt: Date,        // Timestamp when marked complete
}
```

**Integration Strategy:**
```javascript
// Sync pending tasks
async function syncPendingTasks(user) {
  for (const taskTitle of user.pendingTasks) {
    const existingTask = await Task.findOne({
      assignedTo: user._id,
      title: taskTitle,
      status: { $ne: 'Completed' }
    });

    if (!existingTask) {
      await Task.create({
        companyId: user.companyId,
        title: taskTitle,
        description: `Auto-synced from user pending tasks`,
        assignedTo: user._id,
        assignedBy: user.managerId,  // From your user model
        status: 'To Do',
        priority: 'Medium',
        dueDate: user.tasksDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }
  }
}

// Sync completed tasks
async function syncCompletedTasks(user) {
  for (const { achievement, date } of user.achievementHistory) {
    await Task.findOneAndUpdate(
      { title: achievement, assignedTo: user._id },
      { 
        status: 'Completed',
        completedAt: date
      },
      { upsert: true }
    );
  }
}
```

---

### 3. User Model → Leave Model Mapping

#### Your Current Structure:
```typescript
leaveRequests: ObjectId,     // Reference to LeaveRequest
approved: Boolean,
readyToWork: Boolean,
readyToWorkDates: [Date]
```

#### New ERM Structure (Leave.js):
```javascript
{
  companyId: ObjectId,
  employeeId: ObjectId,         // Maps to: User._id
  leaveType: String,            // e.g., 'Annual', 'Sick', 'Personal'
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  reason: String,
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled',
  approvedBy: ObjectId,         // Manager/Admin who approved
  approvalDate: Date,
  rejectionReason: String
}
```

**Integration Strategy:**
```javascript
// When user is marked as approved
async function syncApprovalStatus(user) {
  if (user.approved) {
    // Get any pending leaves
    const pendingLeaves = await LeaveRequest.find({
      userId: user._id,
      status: 'pending'
    });

    for (const leaveReq of pendingLeaves) {
      await Leave.create({
        companyId: user.companyId,
        employeeId: user._id,
        leaveType: leaveReq.type || 'Personal',
        startDate: leaveReq.startDate,
        endDate: leaveReq.endDate,
        numberOfDays: leaveReq.numberOfDays,
        reason: leaveReq.reason,
        status: 'Approved',
        approvedBy: user.supervisorId,
        approvalDate: new Date()
      });
    }
  }
}

// Ready to work dates
async function syncReadyToWorkDates(user) {
  for (const date of user.readyToWorkDates) {
    await Leave.updateMany(
      { 
        employeeId: user._id,
        endDate: { $lte: date }
      },
      { status: 'Completed' }
    );
  }
}
```

---

## Bidirectional Sync Implementation

### Option 1: Event-Driven (Real-time)
```javascript
// user.service.ts - When user updates
userSchema.post('save', async function(doc) {
  // Sync to ERM models
  await syncAttendance(doc);
  await syncTasks(doc);
  await syncLeave(doc);
  
  // Emit WebSocket event for real-time update
  io.emit('user:attendance:updated', {
    userId: doc._id,
    checkInTime: doc.checkInTime,
    checkOutTime: doc.checkOutTime
  });
});
```

### Option 2: Webhook-Based
```javascript
// attendance.controller.ts - When attendance changes in ERM
router.post('/attendance/check-in', async (req, res) => {
  const attendance = await Attendance.create(req.body);
  
  // Trigger webhook to update user system
  await axios.post('https://your-attendance-system/webhook/attendance', {
    userId: attendance.employeeId,
    event: 'check_in',
    data: attendance
  });
  
  res.json(attendance);
});
```

### Option 3: Scheduled Sync (On-Demand)
```javascript
// sync.service.ts - Run every hour
setInterval(async () => {
  const users = await User.find({ companyId: activeCompanyId });
  
  for (const user of users) {
    // Sync latest work session to Attendance
    const latestSession = user.workSessions[user.workSessions.length - 1];
    
    await Attendance.findOneAndUpdate(
      { employeeId: user._id, date: new Date().toDateString() },
      {
        checkInTime: latestSession.checkInTime,
        checkOutTime: latestSession.checkOutTime,
        workHours: latestSession.hoursWorked
      },
      { upsert: true }
    );
  }
}, 60 * 60 * 1000);
```

---

## Data Transformation Rules

### Attendance Status Mapping
| Your System | ERM System |
|-------------|-----------|
| `status: 'ontime'` | `status: 'Present'` |
| `status: 'late'` | `status: 'Late'` |
| No check-in record | `status: 'Absent'` |
| Work from home enabled | `status: 'Present'` (mark in notes) |

### Task Priority Mapping
| Your System | ERM System |
|-------------|-----------|
| Urgent/High | `priority: 'High'` |
| Normal/Medium | `priority: 'Medium'` |
| Low | `priority: 'Low'` |

### Leave Type Mapping
| Your System | ERM System |
|-------------|-----------|
| `approved: true` | `status: 'Approved'` |
| `approved: false` | `status: 'Pending'` |
| In `readyToWorkDates` | Leave ended, ready to resume |

---

## Implementation Checklist

### Phase 1: Setup (TODAY)
- [ ] Create sync service module
- [ ] Add `companyId` field to your User model
- [ ] Set up database connection to ERM Attendance collection
- [ ] Create field mapping helper functions

### Phase 2: Attendance Sync (TOMORROW)
- [ ] Implement `syncAttendance()` function
- [ ] Test check-in/check-out synchronization
- [ ] Verify work hours calculation matches
- [ ] Add logging for troubleshooting

### Phase 3: Task Sync (THIS WEEK)
- [ ] Implement `syncTasks()` function
- [ ] Map pending tasks → Task model
- [ ] Sync achievement history → completedAt
- [ ] Test bidirectional updates

### Phase 4: Leave Sync (THIS WEEK)
- [ ] Implement `syncLeave()` function
- [ ] Map leave requests → Leave model
- [ ] Test approval workflow
- [ ] Verify date calculations

### Phase 5: Real-time Sync (NEXT WEEK)
- [ ] Choose sync strategy (Event/Webhook/Scheduled)
- [ ] Implement chosen sync method
- [ ] Add monitoring and alerts
- [ ] Performance testing

---

## Code Example: Complete Sync Service

```javascript
// sync.service.js
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Leave = require('../models/Leave');

class SyncService {
  async syncUserToERM(user) {
    try {
      // Sync attendance
      await this.syncAttendance(user);
      
      // Sync tasks
      await this.syncTasks(user);
      
      // Sync leave
      await this.syncLeave(user);
      
      console.log(`✓ Synced user ${user._id} to ERM systems`);
    } catch (error) {
      console.error(`✗ Sync failed for user ${user._id}:`, error.message);
      throw error;
    }
  }

  async syncAttendance(user) {
    const latestSession = user.workSessions[user.workSessions.length - 1];
    if (!latestSession) return;

    await Attendance.findOneAndUpdate(
      {
        employeeId: user._id,
        date: new Date(latestSession.checkInTime).toDateString()
      },
      {
        companyId: user.companyId,
        checkInTime: latestSession.checkInTime,
        checkOutTime: latestSession.checkOutTime,
        workHours: latestSession.hoursWorked,
        status: latestSession.status === 'late' ? 'Late' : 'Present'
      },
      { upsert: true, new: true }
    );
  }

  async syncTasks(user) {
    // Pending tasks
    for (const task of user.pendingTasks) {
      await Task.findOneAndUpdate(
        { assignedTo: user._id, title: task },
        {
          companyId: user.companyId,
          status: 'To Do',
          priority: 'Medium'
        },
        { upsert: true }
      );
    }

    // Completed tasks
    for (const { achievement, date } of user.achievementHistory) {
      await Task.findOneAndUpdate(
        { assignedTo: user._id, title: achievement },
        {
          status: 'Completed',
          completedAt: date
        },
        { upsert: true }
      );
    }
  }

  async syncLeave(user) {
    if (user.leaveRequests) {
      await Leave.findOneAndUpdate(
        { employeeId: user._id },
        {
          companyId: user.companyId,
          status: user.approved ? 'Approved' : 'Pending'
        },
        { upsert: true }
      );
    }
  }
}

module.exports = new SyncService();
```

---

## Next Steps

1. **Test the mapping** - Run sync service with test data
2. **Monitor performance** - Ensure no data loss during sync
3. **Add error handling** - Implement retry logic for failed syncs
4. **Document API changes** - Update team on new ERM endpoints
5. **Plan frontend updates** - Show synced data in attendance dashboard

---

**Status:** Ready for implementation  
**Complexity:** Medium - straightforward data mapping  
**Estimated Time:** 2-3 days for full integration  
**Risk Level:** LOW - can run both systems in parallel during transition
