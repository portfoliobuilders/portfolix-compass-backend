const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  baseSalary: { type: Number, required: true },
  da: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  ta: { type: Number, default: 0 },
  othersAllowances: { type: Number, default: 0 },
  pf: { type: Number, default: 12 },
  esi: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  deductions: [String],
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

salaryStructureSchema.index({ companyId: 1, isActive: 1 });
salaryStructureSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
