const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  leaveType: {
    type: String,
    enum: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  numberOfDays: {
    type: Number,
    required: true,
  },
  reason: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: Date,
  approvalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

leaveSchema.index({ companyId: 1, employeeId: 1, status: 1 });
leaveSchema.index({ companyId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
