const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { calculateWorkHours } = require('../utils/timeHelpers');

// ========== ATTENDANCE SERVICE ==========

const recordCheckIn = async (employeeId, checkInTime = new Date()) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: { employeeId, date: today, checkInTime, status: 'present' },
      });
    } else if (!attendance.checkInTime) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkInTime },
      });
    }
    logger.info(`Check-in recorded for employee ${employeeId}`);
    return attendance;
  } catch (error) {
    logger.error(`Check-in error for ${employeeId}:`, error);
    throw new AppError('Failed to record check-in', 500);
  }
};

const recordCheckOut = async (employeeId, checkOutTime = new Date()) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance) {
      throw new AppError('No check-in record found for today', 400);
    }
    if (!attendance.checkInTime) {
      throw new AppError('Employee has not checked in', 400);
    }

    const workHours = calculateWorkHours(attendance.checkInTime, checkOutTime, attendance.breakMinutes);
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOutTime, workHours },
    });
    logger.info(`Check-out recorded for employee ${employeeId}`);
    return updated;
  } catch (error) {
    logger.error(`Check-out error for ${employeeId}:`, error);
    throw error;
  }
};

const getAttendanceReport = async (employeeId, startDate, endDate) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: { date: 'asc' },
    });

    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + parseFloat(a.workHours), 0),
    };
    return { attendance, summary };
  } catch (error) {
    logger.error(`Attendance report error:`, error);
    throw new AppError('Failed to generate attendance report', 500);
  }
};

const updateAttendanceManually = async (attendanceId, data, correctedBy) => {
  try {
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { ...data, manuallyCorrected: true, correctedBy, correctedAt: new Date() },
    });
    logger.info(`Attendance manually updated by ${correctedBy}`);
    return updated;
  } catch (error) {
    logger.error(`Manual update error:`, error);
    throw new AppError('Failed to update attendance', 500);
  }
};

// ========== TASK SERVICE ==========

const createTask = async (taskData, createdBy) => {
  try {
    const task = await prisma.task.create({
      data: { ...taskData, createdBy },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportingTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    logger.info(`Task created by ${createdBy}`);
    return task;
  } catch (error) {
    logger.error(`Task creation error:`, error);
    throw new AppError('Failed to create task', 500);
  }
};

const updateTaskStatus = async (taskId, status, progressPercent, updatedBy) => {
  try {
    const updateData = { status };
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent;
    if (status === 'completed') updateData.completedDate = new Date();

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignee: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    logger.info(`Task updated to status ${status}`);
    return task;
  } catch (error) {
    logger.error(`Task update error:`, error);
    throw new AppError('Failed to update task', 500);
  }
};

const getEmployeeTasks = async (employeeId, status = null) => {
  try {
    const query = { assigneeId: employeeId };
    if (status) query.status = status;

    const tasks = await prisma.task.findMany({
      where: query,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        reportingTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks;
  } catch (error) {
    logger.error(`Get tasks error:`, error);
    throw new AppError('Failed to fetch tasks', 500);
  }
};

const getOverdueTasks = async () => {
  try {
    const today = new Date();
    const overdueTasks = await prisma.task.findMany({
      where: { dueDate: { lt: today }, status: { not: 'completed' } },
      include: { assignee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { dueDate: 'asc' },
    });
    return overdueTasks;
  } catch (error) {
    logger.error(`Get overdue tasks error:`, error);
    throw new AppError('Failed to fetch overdue tasks', 500);
  }
};

// ========== LEAVE SERVICE ==========

const requestLeave = async (leaveData, employeeId) => {
  try {
    const leave = await prisma.leave.create({
      data: { ...leaveData, employeeId, status: 'pending' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    logger.info(`Leave request created by ${employeeId}`);
    return leave;
  } catch (error) {
    logger.error(`Leave request error:`, error);
    throw new AppError('Failed to request leave', 500);
  }
};

const updateLeaveStatus = async (leaveId, status, approverId, approvalComments = '') => {
  try {
    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid leave status', 400);
    }
    const leave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status, approverId, approvalDate: new Date(), approvalComments },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    logger.info(`Leave ${status} by ${approverId}`);
    return leave;
  } catch (error) {
    logger.error(`Leave approval error:`, error);
    throw error;
  }
};

const getPendingLeaveRequests = async () => {
  try {
    const leaves = await prisma.leave.findMany({
      where: { status: 'pending' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return leaves;
  } catch (error) {
    logger.error(`Get pending leaves error:`, error);
    throw new AppError('Failed to fetch pending leaves', 500);
  }
};

const getEmployeeLeaveBalance = async (employeeId, year = new Date().getFullYear()) => {
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const leaves = await prisma.leave.findMany({
      where: { employeeId, startDate: { gte: startOfYear }, endDate: { lte: endOfYear }, status: 'approved' },
    });

    const totalLeaveTaken = leaves.reduce((sum, leave) => sum + parseFloat(leave.totalDays), 0);
    return {
      year,
      annualLeaveQuota: 20,
      leavesTaken: totalLeaveTaken,
      leaveBalance: 20 - totalLeaveTaken,
      leaves,
    };
  } catch (error) {
    logger.error(`Get leave balance error:`, error);
    throw new AppError('Failed to calculate leave balance', 500);
  }
};

// ========== SYNC UTILITIES ==========

const markForSync = async (modelName, recordId) => {
  try {
    await prisma[modelName].update({
      where: { id: recordId },
      data: { syncStatus: 'pending' },
    });
    logger.debug(`${modelName} marked for sync`);
  } catch (error) {
    logger.error(`Mark for sync error:`, error);
  }
};

const getPendingSyncRecords = async (modelName) => {
  try {
    const records = await prisma[modelName].findMany({
      where: { syncStatus: 'pending' },
      take: 100,
    });
    return records;
  } catch (error) {
    logger.error(`Get pending sync error:`, error);
    throw new AppError('Failed to fetch pending sync records', 500);
  }
};

const updateSyncStatus = async (modelName, recordId, status, timestamp = new Date()) => {
  try {
    await prisma[modelName].update({
      where: { id: recordId },
      data: { syncStatus: status, lastSyncedAt: timestamp },
    });
  } catch (error) {
    logger.error(`Update sync status error:`, error);
  }
};

module.exports = {
  recordCheckIn, recordCheckOut, getAttendanceReport, updateAttendanceManually,
  createTask, updateTaskStatus, getEmployeeTasks, getOverdueTasks,
  requestLeave, updateLeaveStatus, getPendingLeaveRequests, getEmployeeLeaveBalance,
  markForSync, getPendingSyncRecords, updateSyncStatus,
};
