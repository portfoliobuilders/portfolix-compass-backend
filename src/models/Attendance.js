const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    workHours: {
      type: Number, // Total hours worked
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave', 'Half-day'],
      default: 'Present',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries by company and date
attendanceSchema.index({ companyId: 1, date: 1 });
attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
