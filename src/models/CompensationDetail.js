const mongoose = require('mongoose');

const compensationDetailSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  payFrequency: {
    type: String,
    enum: ['Weekly', 'Biweekly', 'Monthly'],
    default: 'Monthly',
  },
  effectiveStartDate: {
    type: Date,
    required: true,
  },
  effectiveEndDate: {
    type: Date,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

compensationDetailSchema.index({ companyId: 1, employeeId: 1 });
compensationDetailSchema.index({ companyId: 1, effectiveStartDate: 1 });

module.exports = mongoose.model('CompensationDetail', compensationDetailSchema);
