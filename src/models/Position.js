const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  positionTitle: { type: String, required: true },
  description: String,
  jobGradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobGrade', required: true },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  department: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

positionSchema.index({ companyId: 1, isActive: 1 });
positionSchema.index({ companyId: 1, jobGradeId: 1 });

module.exports = mongoose.model('Position', positionSchema);
