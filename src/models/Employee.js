const mongoose = require('mongoose');

/**
 * Employee Schema
 * Represents employee records for an organization
 */
const employeeSchema = new mongoose.Schema(
  {
    // Organization Reference
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number'],
    },
    dateOfBirth: Date,
    // Employment Details
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
    },
    department: String,
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required'],
    },
    dateOfResignation: Date,
    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Temporary', 'Freelance'],
      default: 'Permanent',
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    // Salary Structure
    salaryStructure: {
      baseSalary: {
        type: Number,
        required: [true, 'Base salary is required'],
        min: [0, 'Base salary cannot be negative'],
      },
      allowances: {
        hra: {
          type: Number,
          default: 0,
        },
        da: {
          type: Number,
          default: 0,
        },
        special: {
          type: Number,
          default: 0,
        },
        other: [
          {
            name: String,
            amount: Number,
          },
        ],
      },
      deductions: {
        pf: {
          type: Number,
          default: 0,
        },
        esi: {
          type: Number,
          default: 0,
        },
        professionalTax: {
          type: Number,
          default: 0,
        },
        other: [
          {
            name: String,
            amount: Number,
          },
        ],
      },
      ctc: Number,
    },
    // Bank Details
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      ifscCode: String,
      branchName: String,
    },
    // Tax Information
    taxDetails: {
      panNumber: String,
      aadharNumber: String,
      pfAccountNumber: String,
      esiNumber: String,
    },
    // Contact Information
    address: {
      presentAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      permanentAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
    // Leave & Attendance
    leaveBalance: {
      annual: {
        type: Number,
        default: 0,
      },
      sick: {
        type: Number,
        default: 0,
      },
      casual: {
        type: Number,
        default: 0,
      },
      compensatory: {
        type: Number,
        default: 0,
      },
    },
    // Status
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'OnLeave', 'Resigned'],
      default: 'Active',
      index: true,
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'employees',
  }
);

// Indexes
employeeSchema.index({ organizationId: 1, employeeId: 1 });
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ email: 1, organizationId: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to calculate CTC
employeeSchema.pre('save', function (next) {
  if (this.salaryStructure) {
    const baseSalary = this.salaryStructure.baseSalary || 0;
    const allowances = this.salaryStructure.allowances
      ? Object.values(this.salaryStructure.allowances).reduce((sum, val) => sum + (val || 0), 0)
      : 0;
    this.salaryStructure.ctc = baseSalary + allowances;
  }
  next();
});

// Method to calculate net salary
employeeSchema.methods.calculateNetSalary = function () {
  const salary = this.salaryStructure;
  const baseSalary = salary.baseSalary || 0;
  const allowances = Object.values(salary.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
  const deductions = Object.values(salary.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
  return baseSalary + allowances - deductions;
};

// Static method to find active employees
employeeSchema.statics.findActiveEmployees = function (organizationId) {
  return this.find({
    organizationId,
    status: { $in: ['Active', 'OnLeave'] },
  }).select('firstName lastName email designation department status');
};

module.exports = mongoose.model('Employee', employeeSchema);
