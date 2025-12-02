const express = require('express');
const router = express.Router();
const ermService = require('../services/erm.service');
const ermSyncService = require('../services/erm-sync.service');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// ========== ATTENDANCE ENDPOINTS ==========

// POST check-in
router.post('/attendance/check-in', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.body;
    const attendance = await ermService.recordCheckIn(employeeId);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST check-out
router.post('/attendance/check-out', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.body;
    const attendance = await ermService.recordCheckOut(employeeId);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET attendance report
router.get('/attendance/report/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const report = await ermService.getAttendanceReport(employeeId, startDate, endDate);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update attendance manually
router.put('/attendance/:attendanceId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { data } = req.body;
    const correctedBy = req.user.id;
    const updated = await ermService.updateAttendanceManually(attendanceId, data, correctedBy);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== TASK ENDPOINTS ==========

// POST create task
router.post('/tasks', authenticate, async (req, res) => {
  try {
    const task = await ermService.createTask(req.body, req.user.id);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update task status
router.put('/tasks/:taskId/status', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, progressPercent } = req.body;
    const updated = await ermService.updateTaskStatus(taskId, status, progressPercent, req.user.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET employee tasks
router.get('/tasks/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;
    const tasks = await ermService.getEmployeeTasks(employeeId, status);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET overdue tasks
router.get('/tasks/overdue/list', authenticate, async (req, res) => {
  try {
    const overdue = await ermService.getOverdueTasks();
    res.status(200).json({ success: true, data: overdue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== LEAVE ENDPOINTS ==========

// POST request leave
router.post('/leaves', authenticate, async (req, res) => {
  try {
    const leave = await ermService.requestLeave(req.body, req.user.id);
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT approve/reject leave
router.put('/leaves/:leaveId/approval', authenticate, authorize('manager'), async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, approvalComments } = req.body;
    const updated = await ermService.updateLeaveStatus(leaveId, status, req.user.id, approvalComments);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET pending leave requests
router.get('/leaves/pending/list', authenticate, authorize('manager'), async (req, res) => {
  try {
    const pending = await ermService.getPendingLeaveRequests();
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET leave balance
router.get('/leaves/balance/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const balance = await ermService.getEmployeeLeaveBalance(employeeId, year);
    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== SYNC ENDPOINTS ==========

// POST manual attendance sync
router.post('/sync/attendance', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { direction } = req.body;
    const result = await ermSyncService.syncAttendanceData(direction || 'bidirectional');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST manual task sync
router.post('/sync/tasks', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { direction } = req.body;
    const result = await ermSyncService.syncTaskData(direction || 'bidirectional');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST manual leave sync
router.post('/sync/leaves', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { direction } = req.body;
    const result = await ermSyncService.syncLeaveData(direction || 'bidirectional');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST webhook receiver
router.post('/webhooks/event', async (req, res) => {
  try {
    const { eventType, entityType, entityId, action, currentData, previousData } = req.body;
    await ermSyncService.handleWebhook(eventType, entityType, entityId, action, currentData, previousData);
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET sync status
router.get('/sync/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const status = await ermSyncService.getSyncStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
