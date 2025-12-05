const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema({
  adjustmentName: {
    type: String,
    required: true,
  },
  adjustmentType: {
    type: String,
    enum: ['EARNING', 'DEDUCTION'],
    required: true,
  },
  description: String,
  frequency: {
    type: String,
    enum: ['One-time', 'Recurring'],
    default: 'Recurring',
  },
  percentageRate: {
    type: Number,
  },
  fixedAmount: {
    type: Number,
  },
  isTaxable: {
    type: Boolean,
    default: false,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  appliesFrom: {
    type: Date,
    required: true,
  },
  appliesUntil: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

adjustmentSchema.index({ companyId: 1, adjustmentType: 1 });
adjustmentSchema.index({ companyId: 1, isRecurring: 1 });

module.exports = mongoose.model('Adjustment', adjustmentSchema);
