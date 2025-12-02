const mongoose = require('mongoose');

const jobGradeSchema = new mongoose.Schema({
  gradeName: { type: String, required: true },
  minSalary: { type: Number, required: true },
  midSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

jobGradeSchema.index({ companyId: 1, isActive: 1 });
jobGradeSchema.index({ companyId: 1, effectiveFrom: 1 });

// Validation: Ensure salary hierarchy
jobGradeSchema.pre('save', function(next) {
  if (this.maxSalary < this.midSalary || this.midSalary < this.minSalary) {
    return next(new Error('Salary hierarchy violated: maxSalary >= midSalary >= minSalary'));
  }
  next();
});

module.exports = mongoose.model('JobGrade', jobGradeSchema);
