const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema({
  benefitName: { type: String, required: true },
  benefitType: { type: String, enum: ['Health', 'Dental', 'Retirement', '401k', 'Stock Options', 'Other'], required: true },
  description: String,
  employerContribution: { type: Number, default: 0 },
  employeeContribution: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

benefitSchema.index({ companyId: 1, benefitType: 1 });
benefitSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Benefit', benefitSchema);
