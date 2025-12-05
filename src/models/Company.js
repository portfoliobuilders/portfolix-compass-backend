const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  companyCode: {
    type: String,
    required: true,
    unique: true,
  },
  registrationNumber: {
    type: String,
    required: true,
  },
  panNumber: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
  },
  tandNumber: {
    type: String,
  },
  industry: {
    type: String,
  },
  businessType: {
    type: String,
    enum: ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'],
  },
  website: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  foundedYear: {
    type: Number,
  },
  employeeCount: {
    type: Number,
    default: 0,
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

companySchema.index({ companyCode: 1 });
companySchema.index({ registrationNumber: 1 });
companySchema.index({ organizationId: 1 });
companySchema.index({ status: 1 });

module.exports = mongoose.model('Company', companySchema);
