const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const ermService = require('./erm.service');

// ========== BIDIRECTIONAL SYNC SERVICE ==========

const syncAttendanceData = async (direction = 'bidirectional') => {
  const syncBatchId = `sync-${Date.now()}`;
  let recordsProcessed = 0, recordsFailed = 0;
  
  try {
    const startTime = new Date();
    
    if (direction === 'pull' || direction === 'bidirectional') {
      const pendingAttendance = await ermService.getPendingSyncRecords('Attendance');
      for (const record of pendingAttendance) {
        try {
          await pushToCompass('attendance', record);
          await ermService.updateSyncStatus('Attendance', record.id, 'synced');
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
          logger.error(`Failed to sync attendance ${record.id}:`, error);
        }
      }
    }
    
    if (direction === 'push' || direction === 'bidirectional') {
      const compassData = await fetchFromCompass('attendance');
      for (const record of compassData) {
        try {
          await saveToERM('Attendance', record);
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
          logger.error(`Failed to sync attendance to ERM:`, error);
        }
      }
    }
    
    const endTime = new Date();
    await logSyncActivity({
      syncType: 'attendance',
      direction,
      status: recordsFailed === 0 ? 'success' : 'partial',
      recordsProcessed,
      recordsFailed,
      sourceSystem: 'erm',
      destinationSystem: 'compass',
      syncBatchId,
      startTime,
      endTime,
      duration: endTime - startTime,
    });
    
    logger.info(`Attendance sync completed: ${recordsProcessed} processed, ${recordsFailed} failed`);
    return { recordsProcessed, recordsFailed, status: 'completed' };
  } catch (error) {
    logger.error('Attendance sync error:', error);
    await logSyncActivity({
      syncType: 'attendance',
      direction,
      status: 'failed',
      recordsProcessed,
      recordsFailed,
      errorMessage: error.message,
      syncBatchId,
    });
    throw error;
  }
};

const syncTaskData = async (direction = 'bidirectional') => {
  const syncBatchId = `sync-${Date.now()}`;
  let recordsProcessed = 0, recordsFailed = 0;
  
  try {
    const startTime = new Date();
    
    if (direction === 'pull' || direction === 'bidirectional') {
      const pendingTasks = await ermService.getPendingSyncRecords('Task');
      for (const record of pendingTasks) {
        try {
          await pushToCompass('task', record);
          await ermService.updateSyncStatus('Task', record.id, 'synced');
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
          logger.error(`Failed to sync task ${record.id}:`, error);
        }
      }
    }
    
    if (direction === 'push' || direction === 'bidirectional') {
      const compassData = await fetchFromCompass('task');
      for (const record of compassData) {
        try {
          await saveToERM('Task', record);
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
        }
      }
    }
    
    const endTime = new Date();
    await logSyncActivity({
      syncType: 'task',
      direction,
      status: recordsFailed === 0 ? 'success' : 'partial',
      recordsProcessed,
      recordsFailed,
      syncBatchId,
      startTime,
      endTime,
      duration: endTime - startTime,
    });
    
    logger.info(`Task sync completed: ${recordsProcessed} processed, ${recordsFailed} failed`);
    return { recordsProcessed, recordsFailed, status: 'completed' };
  } catch (error) {
    logger.error('Task sync error:', error);
    throw error;
  }
};

const syncLeaveData = async (direction = 'bidirectional') => {
  const syncBatchId = `sync-${Date.now()}`;
  let recordsProcessed = 0, recordsFailed = 0;
  
  try {
    const startTime = new Date();
    
    if (direction === 'pull' || direction === 'bidirectional') {
      const pendingLeaves = await ermService.getPendingSyncRecords('Leave');
      for (const record of pendingLeaves) {
        try {
          await pushToCompass('leave', record);
          await ermService.updateSyncStatus('Leave', record.id, 'synced');
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
          logger.error(`Failed to sync leave ${record.id}:`, error);
        }
      }
    }
    
    if (direction === 'push' || direction === 'bidirectional') {
      const compassData = await fetchFromCompass('leave');
      for (const record of compassData) {
        try {
          await saveToERM('Leave', record);
          recordsProcessed++;
        } catch (error) {
          recordsFailed++;
        }
      }
    }
    
    const endTime = new Date();
    await logSyncActivity({
      syncType: 'leave',
      direction,
      status: recordsFailed === 0 ? 'success' : 'partial',
      recordsProcessed,
      recordsFailed,
      syncBatchId,
      startTime,
      endTime,
      duration: endTime - startTime,
    });
    
    return { recordsProcessed, recordsFailed, status: 'completed' };
  } catch (error) {
    logger.error('Leave sync error:', error);
    throw error;
  }
};

const logSyncActivity = async (syncData) => {
  try {
    await prisma.eRMSyncLog.create({ data: syncData });
  } catch (error) {
    logger.error('Failed to log sync activity:', error);
  }
};

const pushToCompass = async (dataType, record) => {
  const apiEndpoint = `${process.env.COMPASS_API_URL}/api/erm/${dataType}`;
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.COMPASS_API_KEY}`,
    },
    body: JSON.stringify(record),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to push to Compass: ${response.statusText}`);
  }
  
  return response.json();
};

const fetchFromCompass = async (dataType) => {
  const apiEndpoint = `${process.env.COMPASS_API_URL}/api/erm/${dataType}/sync`;
  const response = await fetch(apiEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.COMPASS_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from Compass: ${response.statusText}`);
  }
  
  return response.json();
};

const saveToERM = async (model, data) => {
  return await prisma[model].upsert({
    where: { id: data.id || 'new' },
    update: data,
    create: data,
  });
};

const handleWebhook = async (eventType, entityType, entityId, action, currentData, previousData) => {
  try {
    await prisma.webhookEventLog.create({
      data: {
        eventType,
        entityType,
        entityId,
        action,
        currentData: JSON.stringify(currentData),
        previousData: JSON.stringify(previousData),
        sourceSystem: 'erm',
        status: 'pending',
      },
    });
    
    logger.info(`Webhook event logged: ${eventType} - ${entityId}`);
    
    if (action === 'created' || action === 'updated') {
      await ermService.markForSync(entityType, entityId);
    }
  } catch (error) {
    logger.error(`Webhook handler error:`, error);
    throw error;
  }
};

const getSyncStatus = async () => {
  try {
    const logs = await prisma.eRMSyncLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    const pendingAttendance = await ermService.getPendingSyncRecords('Attendance');
    const pendingTasks = await ermService.getPendingSyncRecords('Task');
    const pendingLeaves = await ermService.getPendingSyncRecords('Leave');
    
    return {
      recentSyncs: logs,
      pendingRecords: {
        attendance: pendingAttendance.length,
        tasks: pendingTasks.length,
        leaves: pendingLeaves.length,
      },
    };
  } catch (error) {
    logger.error('Get sync status error:', error);
    throw error;
  }
};

module.exports = {
  syncAttendanceData,
  syncTaskData,
  syncLeaveData,
  handleWebhook,
  getSyncStatus,
  logSyncActivity,
};
