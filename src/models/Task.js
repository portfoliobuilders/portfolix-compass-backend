const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'In Review', 'Completed', 'On Hold'],
      default: 'To Do',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
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
taskSchema.index({ companyId: 1, assignedTo: 1 });
taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ companyId: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
