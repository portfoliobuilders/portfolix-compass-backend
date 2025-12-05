const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

/**
 * SyncLog Model
 * Tracks all HRM-ERM synchronization operations for audit trail and monitoring
 * Fixes P2-0-001: Sync logs not structured
 */

const syncLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuid(),
    primary: true,
  },
  sourceSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true,
    index: true,
  },
  destinationSystem: {
    type: String,
    enum: ['HRM', 'ERM'],
    required: true,
  },
  entityType: {
    type: String,
    enum: ['Employee', 'Leave', 'Attendance', 'Salary', 'Department', 'Position'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  operation: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'SYNC'],
    required: true,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'PENDING',
  },
  syncTimestamp: {
    type: Date,
    default: Date.now,
  },
  completedTimestamp: Date,
  errorMessage: String,
  metadata: mongoose.Schema.Types.Mixed,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false, _id: false });

syncLogSchema.index({ companyId: 1, status: 1 });
syncLogSchema.index({ entityType: 1, entityId: 1 });
syncLogSchema.index({ sourceSystem: 1, destinationSystem: 1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
