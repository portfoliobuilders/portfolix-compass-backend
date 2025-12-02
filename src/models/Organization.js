const mongoose = require('mongoose');

/**
 * Organization Schema
 * Represents a company/organization using the Payroll system
 */
const organizationSchema = new mongoose.Schema(
  {
    // Organization Identification
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [255, 'Organization name cannot exceed 255 characters'],
      index: true,
    },
    orgCode: {
      type: String,
      required: [true, 'Organization code is required'],
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{3,10}$/, 'Organization code must be 3-10 alphanumeric characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Organization email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please provide a valid phone number'],
    },

    // Organization Details
    industry: {
      type: String,
      enum: [
        'IT',
        'Finance',
        'Healthcare',
        'Manufacturing',
        'Retail',
        'Education',
        'Consulting',
        'Other',
      ],
      default: 'Other',
    },
    foundedYear: {
      type: Number,
      min: [1800, 'Founded year must be after 1800'],
      max: [new Date().getFullYear(), 'Founded year cannot be in future'],
    },
    employeeCount: {
      type: Number,
      min: [0, 'Employee count cannot be negative'],
      default: 0,
    },

    // Address Information
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    // Tax & Compliance Information
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    panNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
    },
    gstNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    tandNumber: {
      type: String,
      sparse: true,
    },
    pfRegistration: {
      type: String,
      sparse: true,
    },

    // Tax Configuration
    taxConfigurations: {
      incomeTaxSlabYear: {
        type: Number,
        default: new Date().getFullYear(),
      },
      professionalTaxState: {
        type: String,
        enum: ['Kerala', 'Karnataka', 'Maharashtra', 'Other'],
        default: 'Kerala',
      },
      pfContributionRate: {
        type: Number,
        min: [0, 'PF contribution rate cannot be negative'],
        max: [100, 'PF contribution rate cannot exceed 100'],
        default: 12,
      },
      esicContributionRate: {
        type: Number,
        min: [0, 'ESIC contribution rate cannot be negative'],
        max: [100, 'ESIC contribution rate cannot exceed 100'],
        default: 3.25,
      },
    },

    // Subscription & Plan Information
    subscriptionPlan: {
      type: String,
      enum: ['Free', 'Starter', 'Professional', 'Enterprise'],
      default: 'Free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Expired'],
      default: 'Active',
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,

    // Authorization & Access Control
    adminUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['Super Admin', 'Admin', 'Finance Manager'],
          default: 'Admin',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
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

    // Additional Configuration
    settings: {
      allowSalaryAdvance: {
        type: Boolean,
        default: true,
      },
      allowLeaveEncashment: {
        type: Boolean,
        default: true,
      },
      defaultPaymentCycle: {
        type: String,
        enum: ['Monthly', 'Bi-weekly', 'Weekly'],
        default: 'Monthly',
      },
      bankAccountFor Salary: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
      },
    },
  },
  {
    timestamps: true,
    collection: 'organizations',
  },
);

// Indexes for better query performance
organizationSchema.index({ orgCode: 1, email: 1 });
organizationSchema.index({ status: 1, subscriptionStatus: 1 });
organizationSchema.index({ createdAt: -1 });

// Virtual for formatted address
organizationSchema.virtual('formattedAddress').get(function () {
  if (!this.address) return '';
  return [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country,
  ]
    .filter(Boolean)
    .join(', ');
});

// Pre-save middleware for validation
organizationSchema.pre('save', async function (next) {
  if (!this.isModified('panNumber')) return next();

  // Validate PAN uniqueness only if changed
  const existing = await this.constructor.findOne({
    panNumber: this.panNumber,
    _id: { $ne: this._id },
  });

  if (existing) {
    throw new Error('PAN Number already exists in the system');
  }
  next();
});

// Method to check if organization is active and valid
organizationSchema.methods.isValidAndActive = function () {
  return this.status === 'Active' && this.subscriptionStatus === 'Active' && this.isVerified;
};

// Method to get organization summary
organizationSchema.methods.getSummary = function () {
  return {
    id: this._id,
    name: this.name,
    orgCode: this.orgCode,
    email: this.email,
    employeeCount: this.employeeCount,
    subscriptionPlan: this.subscriptionPlan,
    status: this.status,
    isVerified: this.isVerified,
  };
};

// Static method to find active organizations
organizationSchema.statics.findActive = function () {
  return this.find({
    status: 'Active',
    subscriptionStatus: 'Active',
  }).select('name orgCode email employeeCount subscriptionPlan');
};

// Index to support text search
organizationSchema.index({
  name: 'text',
  orgCode: 'text',
  email: 'text',
});

module.exports = mongoose.model('Organization', organizationSchema);
