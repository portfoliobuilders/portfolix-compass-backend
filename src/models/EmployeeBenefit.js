const mongoose = require('mongoose');

const employeeBenefitSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  benefitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Benefit',
    required: true,
  },
  enrollmentDate: {
    type: Date,
    required: true,
  },
  coverageStartDate: {
    type: Date,
    required: true,
  },
  coverageEndDate: {
    type: Date,
  },
  coverageAmount: {
    type: Number,
  },
  isCovered: {
    type: Boolean,
    default: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
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

employeeBenefitSchema.index({ companyId: 1, employeeId: 1, isCovered: 1 });
employeeBenefitSchema.index({ companyId: 1, benefitId: 1 });

module.exports = mongoose.model('EmployeeBenefit', employeeBenefitSchema);
