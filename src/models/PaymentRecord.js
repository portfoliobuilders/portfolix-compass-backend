const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payPeriodStartDate: { type: Date, required: true },
  payPeriodEndDate: { type: Date, required: true },
  baseSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  grossSalary: { type: Number, required: true },
  taxDeduction: { type: Number, default: 0 },
  providentFund: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['BANK_TRANSFER', 'CHEQUE', 'CASH'], default: 'BANK_TRANSFER' },
  paymentStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'PAID', 'FAILED'], default: 'PENDING' },
  transactionId: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

paymentRecordSchema.index({ companyId: 1, employeeId: 1, payPeriodStartDate: 1 });
paymentRecordSchema.index({ companyId: 1, paymentStatus: 1 });
paymentRecordSchema.index({ companyId: 1, paymentDate: 1 });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
