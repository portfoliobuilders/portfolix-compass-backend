const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
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
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    attachments: [
      {
        url: String,
        filename: String,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
leaveSchema.index({ companyId: 1, employeeId: 1, startDate: 1 });
leaveSchema.index({ companyId: 1, status: 1 });
leaveSchema.index({ companyId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
