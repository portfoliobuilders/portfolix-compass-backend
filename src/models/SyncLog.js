const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

/**
 * SyncLog Model
 * Tracks all HRM-ERM synchronization operations for audit trail and monitoring
 * Fixes P2-O-001: Sync logs not structured
 */

const syncLogSchema = new mongoose.Schema({
  // Identification
  _id: {
    type: String,
    default: () => uuid(),
    primary: true
  },
  
  // Sync Context
  sourceSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true,
    index: true
  },
  targetSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true,
    index: true
  },
  
  // Entity Information
  entityType: {
    type: String,
    enum: ['EMPLOYEE', 'ATTENDANCE', 'ROLE', 'PERMISSION', 'DEPARTMENT', 'LEAVE'],
    required: true,
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Operation Details
  operation: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'TERMINATE', 'BULK_SYNC'],
    required: true,
    index: true
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL', 'RETRY'],
    default: 'PENDING',
    index: true
  },
  
  // Sync Payload
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    description: 'Full entity data that was synced'
  },
  
  // Tracking Information
  correlationId: {
    type: String,
    required: true,
    index: true,
    description: 'UUID for end-to-end request tracing'
  },
  
  // Error Information
  errorMessage: {
    type: String,
    required: false,
    default: null
  },
  errorStack: {
    type: String,
    required: false,
    default: null
  },
  errorCode: {
    type: String,
    required: false,
    default: null
  },
  
  // Retry Information
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1
  },
  lastRetryAt: {
    type: Date,
    required: false,
    default: null
  },
  nextRetryAt: {
    type: Date,
    required: false,
    default: null
  },
  
  // Performance Metrics
  duration: {
    type: Number,
    required: false,
    default: null,
    description: 'Duration in milliseconds'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: false,
    default: null,
    index: true
  },
  
  // User Information
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: 'User'
  },
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'sync_logs',
  timestamps: true,
  discriminatorKey: 'operationType'
});

// Indexes for performance optimization
syncLogSchema.index({ correlationId: 1, status: 1 });
syncLogSchema.index({ entityId: 1, operation: 1, status: 1 });
syncLogSchema.index({ status: 1, createdAt: -1 });
syncLogSchema.index({ sourceSystem: 1, targetSystem: 1, createdAt: -1 });
syncLogSchema.index({ correlationId: 1, createdAt: -1 });
syncLogSchema.index({ completedAt: 1 }); // For cleanup queries

// Virtual for readable duration
syncLogSchema.virtual('durationSeconds').get(function() {
  return this.duration ? (this.duration / 1000).toFixed(2) : 'N/A';
});

// Methods
syncLogSchema.methods = {
  /**
   * Mark sync as completed
   */
  markCompleted(duration) {
    this.status = 'COMPLETED';
    this.completedAt = new Date();
    if (duration) this.duration = duration;
    return this.save();
  },
  
  /**
   * Mark sync as failed
   */
  markFailed(error, retryable = true) {
    this.status = retryable ? 'FAILED' : 'FAILED';
    this.errorMessage = error.message;
    this.errorStack = error.stack;
    this.errorCode = error.code || 'UNKNOWN';
    this.completedAt = new Date();
    return this.save();
  },
  
  /**
   * Increment retry count and schedule next retry
   */
  scheduleRetry(backoffMs) {
    this.retryCount = (this.retryCount || 0) + 1;
    this.status = 'RETRY';
    this.lastRetryAt = new Date();
    this.nextRetryAt = new Date(Date.now() + backoffMs);
    return this.save();
  },
  
  /**
   * Check if sync is retryable
   */
  isRetryable() {
    return this.retryCount < 3 && (this.status === 'FAILED' || this.status === 'PENDING');
  }
};

// Statics
syncLogSchema.statics = {
  /**
   * Get sync statistics
   */
  async getStatistics(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await this.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return {
      period: `Last ${hours} hours`,
      since: since.toISOString(),
      stats
    };
  },
  
  /**
   * Get pending retries
   */
  async getPendingRetries() {
    return this.find({
      status: { $in: ['FAILED', 'RETRY'] },
      retryCount: { $lt: 3 },
      nextRetryAt: { $lte: new Date() }
    }).sort({ nextRetryAt: 1 }).limit(100);
  },
  
  /**
   * Cleanup old records
   */
  async cleanupOldLogs(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.deleteMany({
      status: 'COMPLETED',
      completedAt: { $lt: cutoffDate }
    });
  }
};

// Pre-save middleware
syncLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model
const SyncLog = mongoose.model('SyncLog', syncLogSchema);

module.exports = SyncLog;
