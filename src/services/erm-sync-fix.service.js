const axios = require('axios');
const logger = require('../config/logger');
const SyncLog = require('../models/SyncLog');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

/**
 * ERMSyncService - Handles synchronization between HRM and ERM systems
 * Features:
 * - Exponential backoff retry logic
 * - Correlation ID tracking
 * - Comprehensive error handling
 * - Structured logging
 */
class ERMSyncService {
  constructor() {
    // DEFINED: HRM is source of truth, ERM is consumer
    this.syncDirection = 'HRM_TO_ERM';
    this.retryConfig = {
      maxRetries: 3,
      backoffMs: 1000,
      timeoutMs: 30000
    };
    this.ermApiUrl = process.env.ERM_API_URL || 'http://localhost:3001';
  }

  /**
   * Sync Employee data to ERM
   * Implements exponential backoff retry strategy
   */
  async syncEmployee(employeeId, correlationId) {
    const startTime = Date.now();
    let syncLog = null;

    try {
      syncLog = await SyncLog.findOne({ entityId: employeeId, operation: 'CREATE' })
        .sort({ createdAt: -1 });

      if (!syncLog) {
        throw new Error(`Sync log not found for employee ${employeeId}`);
      }

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          const employee = await Employee.findById(employeeId);
          if (!employee) throw new Error('Employee not found');

          const payload = {
            _id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            department: employee.department,
            employeeCode: employee.employeeCode,
            designation: employee.designation,
            joinDate: employee.joinDate,
            status: employee.status,
            source: 'HRM',
            sourceSystemId: employeeId,
            syncTimestamp: new Date().toISOString()
          };

          logger.info('Syncing employee to ERM', {
            correlationId,
            employeeId,
            attempt: attempt + 1,
            totalAttempts: this.retryConfig.maxRetries + 1,
            timestamp: new Date().toISOString()
          });

          const response = await axios.post(
            `${this.ermApiUrl}/api/v1/employees/sync`,
            payload,
            {
              headers: {
                'X-Correlation-ID': correlationId,
                'X-Source-System': 'HRM',
                'Content-Type': 'application/json'
              },
              timeout: this.retryConfig.timeoutMs
            }
          );

          // Success - update sync log
          syncLog.status = 'COMPLETED';
          syncLog.completedAt = new Date();
          syncLog.duration = Date.now() - startTime;
          syncLog.attempts = attempt + 1;
          await syncLog.save();

          logger.info('Employee synced successfully', {
            correlationId,
            employeeId,
            duration: syncLog.duration,
            attempt: attempt + 1,
            timestamp: new Date().toISOString()
          });

          return syncLog;
        } catch (err) {
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.retryConfig.backoffMs * Math.pow(2, attempt);
            logger.warn('Employee sync retry scheduled', {
              correlationId,
              employeeId,
              attempt: attempt + 1,
              totalAttempts: this.retryConfig.maxRetries + 1,
              delay,
              error: err.message,
              timestamp: new Date().toISOString()
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      // Final failure - update sync log
      if (syncLog) {
        syncLog.status = 'FAILED';
        syncLog.errorMessage = err.message;
        syncLog.errorStack = err.stack;
        syncLog.duration = Date.now() - startTime;
        await syncLog.save();
      }

      logger.error('Employee sync failed after all retries', {
        correlationId,
        employeeId,
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      throw err;
    }
  }

  /**
   * Sync Attendance data to ERM
   * HRM is source of truth for attendance
   */
  async syncAttendance(attendanceId, correlationId) {
    const startTime = Date.now();
    let syncLog = null;

    try {
      syncLog = await SyncLog.findOne({ entityId: attendanceId, operation: 'CREATE' })
        .sort({ createdAt: -1 });

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          const attendance = await Attendance.findById(attendanceId);
          if (!attendance) throw new Error('Attendance record not found');

          const payload = {
            employeeId: attendance.employeeId,
            date: attendance.date,
            status: attendance.status,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            source: 'HRM',
            sourceSystemId: attendanceId,
            syncTimestamp: new Date().toISOString()
          };

          await axios.post(
            `${this.ermApiUrl}/api/v1/attendance/sync`,
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
          syncLog.duration = Date.now() - startTime;
          await syncLog.save();

          logger.info('Attendance synced successfully', {
            correlationId,
            attendanceId,
            duration: syncLog.duration
          });

          return syncLog;
        } catch (err) {
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.retryConfig.backoffMs * Math.pow(2, attempt);
            logger.warn(`Attendance sync retry ${attempt + 1}/${this.retryConfig.maxRetries}`, {
              correlationId,
              attendanceId,
              delay,
              error: err.message
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      if (syncLog) {
        syncLog.status = 'FAILED';
        syncLog.errorMessage = err.message;
        syncLog.duration = Date.now() - startTime;
        await syncLog.save();
      }

      logger.error('Attendance sync failed', {
        correlationId,
        attendanceId,
        error: err.message,
        duration: Date.now() - startTime
      });

      throw err;
    }
  }

  /**
   * Sync Role/Permission changes to ERM
   */
  async syncRole(roleId, correlationId) {
    const startTime = Date.now();
    let syncLog = null;

    try {
      syncLog = await SyncLog.findOne({ entityId: roleId, operation: 'UPDATE' })
        .sort({ createdAt: -1 });

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          const role = await Role.findById(roleId);
          if (!role) throw new Error('Role not found');

          const payload = {
            _id: role._id,
            name: role.name,
            permissions: role.permissions,
            description: role.description,
            source: 'HRM',
            sourceSystemId: roleId,
            syncTimestamp: new Date().toISOString()
          };

          await axios.put(
            `${this.ermApiUrl}/api/v1/roles/${roleId}`,
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
          syncLog.duration = Date.now() - startTime;
          await syncLog.save();

          logger.info('Role synced successfully', {
            correlationId,
            roleId,
            duration: syncLog.duration
          });

          return syncLog;
        } catch (err) {
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.retryConfig.backoffMs * Math.pow(2, attempt);
            logger.warn(`Role sync retry ${attempt + 1}/${this.retryConfig.maxRetries}`, {
              correlationId,
              roleId,
              delay,
              error: err.message
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      if (syncLog) {
        syncLog.status = 'FAILED';
        syncLog.errorMessage = err.message;
        syncLog.duration = Date.now() - startTime;
        await syncLog.save();
      }

      logger.error('Role sync failed', {
        correlationId,
        roleId,
        error: err.message,
        duration: Date.now() - startTime
      });

      throw err;
    }
  }

  /**
   * Terminate employee in ERM system
   * Cascades access revocation
   */
  async terminateEmployee(employeeId, reason, correlationId) {
    const startTime = Date.now();
    let syncLog = null;

    try {
      syncLog = await SyncLog.create({
        sourceSystem: 'HRM',
        targetSystem: 'ERM',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        operation: 'TERMINATE',
        status: 'PENDING',
        payload: { employeeId, reason, terminationDate: new Date() },
        correlationId,
        retryCount: 0
      });

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          await axios.post(
            `${this.ermApiUrl}/api/v1/employees/${employeeId}/terminate`,
            { reason, terminationDate: new Date() },
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
          syncLog.duration = Date.now() - startTime;
          await syncLog.save();

          logger.info('Employee terminated in ERM', {
            correlationId,
            employeeId,
            reason,
            duration: syncLog.duration
          });

          return syncLog;
        } catch (err) {
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.retryConfig.backoffMs * Math.pow(2, attempt);
            logger.warn(`Employee termination retry ${attempt + 1}/${this.retryConfig.maxRetries}`, {
              correlationId,
              employeeId,
              delay,
              error: err.message
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      if (syncLog) {
        syncLog.status = 'FAILED';
        syncLog.errorMessage = err.message;
        syncLog.duration = Date.now() - startTime;
        await syncLog.save();
      }

      logger.error('Employee termination failed', {
        correlationId,
        employeeId,
        error: err.message,
        duration: Date.now() - startTime
      });

      throw err;
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  async getSyncStats(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await SyncLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    return {
      period: `Last ${hours} hours`,
      since: since.toISOString(),
      stats
    };
  }
}

module.exports = new ERMSyncService();
