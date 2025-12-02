const mongoose = require('mongoose');

const wellnessBenefitsSchema = new mongoose.Schema({
  wellnessName: { type: String, required: true },
  wellnessType: { type: String, enum: ['Gym', 'Mental Health', 'Yoga', 'Nutrition', 'Fitness Tracker', 'Wellness Credits', 'Meditation App', 'Other'], required: true },
  description: String,
  creditAmount: { type: Number, default: 0 },
  creditFrequency: { type: String, enum: ['Monthly', 'Quarterly', 'Annual'], default: 'Monthly' },
  maxUsageLimit: { type: Number },
  vendor: String,
  vendorContact: String,
  isActive: { type: Boolean, default: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

wellnessBenefitsSchema.index({ companyId: 1, wellnessType: 1 });
wellnessBenefitsSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('WellnessBenefits', wellnessBenefitsSchema);
