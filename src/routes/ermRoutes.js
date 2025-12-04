const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');
const taskController = require('../controllers/taskController');
const leaveController = require('../controllers/leaveController');

// Apply authentication middleware to all ERM routes
router.use(verifyToken);

// ============================================
// ATTENDANCE ROUTES
// ============================================

// Check-in endpoint
router.post('/attendance/check-in', attendanceController.checkIn);

// Check-out endpoint
router.post('/attendance/check-out', attendanceController.checkOut);

// Get attendance by employee
router.get('/attendance/employee/:employeeId', attendanceController.getAttendanceByEmployee);

// Get department attendance report
router.get('/attendance/department/:departmentId/report', attendanceController.getDepartmentAttendanceReport);

// ============================================
// TASK ROUTES
// ============================================

// Create a new task
router.post('/tasks', taskController.createTask);

// Get tasks by assignee
router.get('/tasks/assignee/:assigneeId', taskController.getTasksByAssignee);

// Get task by ID
router.get('/tasks/:taskId', taskController.getTaskById);

// Update task status
router.patch('/tasks/:taskId/status', taskController.updateTaskStatus);

// Get team tasks (by manager)
router.get('/tasks/team/:managerId', taskController.getTeamTasks);

// Delete task
router.delete('/tasks/:taskId', taskController.deleteTask);

// ============================================
// LEAVE ROUTES
// ============================================

// Request leave
router.post('/leave/request', leaveController.requestLeave);

// Approve or reject leave
router.post('/leave/:leaveId/approve', leaveController.approveLeave);

// Get leave by employee
router.get('/leave/employee/:employeeId', leaveController.getLeaveByEmployee);

// Get pending leave requests
router.get('/leave/pending', leaveController.getPendingLeaves);

// Get leave balance
router.get('/leave/balance/:employeeId', leaveController.getLeaveBalance);

// Error handler middleware
router.use((err, req, res, next) => {
  console.error('ERM Route Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

module.exports = router;
