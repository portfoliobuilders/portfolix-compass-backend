# Remaining 4 Models - Ready for Implementation

## Quick Overview
These 4 models are the final pieces needed to complete the compensat and payroll system. Each is production-ready for immediate implementation.

## MODEL 1: Benefit.js

```javascript
const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema({
  benefitName: { type: String, required: true },
  benefitType: { type: String, enum: ['Health', 'Dental', 'Retirement', '401k', 'Stock Options', 'Other'], required: true },
  description: String,
  employerContribution: { type: Number, default: 0 }, // percentage
  employeeContribution: { type: Number, default: 0 }, // percentage
  isActive: { type: Boolean, default: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

benefitSchema.index({ companyId: 1, benefitType: 1 });
benefitSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Benefit', benefitSchema);
```

**File:** `src/models/Benefit.js`
**Purpose:** Define available benefits (health insurance, retirement plans, etc.)
**Key Fields:** benefitType (enum), employerContribution, employeeContribution

---

## MODEL 2: EmployeeBenefit.js

```javascript
const mongoose = require('mongoose');

const employeeBenefitSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  benefitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Benefit', required: true },
  enrollmentDate: { type: Date, required: true },
  coverageStartDate: { type: Date, required: true },
  coverageEndDate: { type: Date },
  coverageAmount: { type: Number }, // for insurance policies
  isCovered: { type: Boolean, default: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

employeeBenefitSchema.index({ companyId: 1, employeeId: 1, isActive: 1 });
employeeBenefitSchema.index({ companyId: 1, benefitId: 1 });

module.exports = mongoose.model('EmployeeBenefit', employeeBenefitSchema);
```

**File:** `src/models/EmployeeBenefit.js`
**Purpose:** Track which benefits each employee is enrolled in
**Key Fields:** employeeId, benefitId (M:M relationship), coverage dates
**Relationship:** Links Employee (1) to Benefit (M)

---

## MODEL 3: Adjustment.js

```javascript
const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema({
  adjustmentName: { type: String, required: true },
  adjustmentType: { type: String, enum: ['EARNING', 'DEDUCTION'], required: true },
  description: String,
  frequency: { type: String, enum: ['One-time', 'Recurring'], default: 'Recurring' },
  percentageRate: { type: Number }, // for percentage-based
  fixedAmount: { type: Number }, // for fixed amount
  isTaxable: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  appliesFrom: { type: Date, required: true },
  appliesUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

adjustmentSchema.index({ companyId: 1, adjustmentType: 1 });
adjustmentSchema.index({ companyId: 1, isRecurring: 1 });

module.exports = mongoose.model('Adjustment', adjustmentSchema);
```

**File:** `src/models/Adjustment.js`
**Purpose:** Define earnings (bonuses, overtime) and deductions (taxes, loans)
**Key Fields:** adjustmentType (EARNING/DEDUCTION), percentageRate, fixedAmount, isTaxable
**Use Cases:** Overtime pay, Performance bonus, Professional tax, Loan deduction

---

## MODEL 4: PaymentRecord.js (Most Important)

```javascript
const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payPeriodStartDate: { type: Date, required: true },
  payPeriodEndDate: { type: Date, required: true },
  baseSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 }, // DA+HRA+TA+Others
  grossSalary: { type: Number, required: true }, // baseSalary + allowances
  taxDeduction: { type: Number, default: 0 },
  providentFund: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true }, // grossSalary - deductions
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['BANK_TRANSFER', 'CHEQUE', 'CASH'], default: 'BANK_TRANSFER' },
  paymentStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'PAID', 'FAILED'], default: 'PENDING' },
  transactionId: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

paymentRecordSchema.index({ companyId: 1, employeeId: 1, payPeriodStartDate: 1 });
paymentRecordSchema.index({ companyId: 1, paymentStatus: 1 });
paymentRecordSchema.index({ companyId: 1, paymentDate: 1 });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
```

**File:** `src/models/PaymentRecord.js`
**Purpose:** Record actual payroll transactions
**Key Fields:** All salary components, payment details, status tracking
**Critical:** This is where monthly salary calculations are stored
**Relationship:** Every employee gets one PaymentRecord per month

---

## Implementation Instructions

### For Karthik (Backend Developer):
1. Create 4 new files in `src/models/`:
   - Benefit.js
   - EmployeeBenefit.js
   - Adjustment.js
   - PaymentRecord.js

2. Copy the code from this document into each file

3. Run migrations to create indexes:
   ```bash
   npm run migrate:indexes
   ```

4. Verify in MongoDB:
   ```bash
   db.benefits.getIndexes()
   db.employeebenefits.getIndexes()
   db.adjustments.getIndexes()
   db.paymentrecords.getIndexes()
   ```

### Test Data (MongoDB):

**Insert Sample Benefit:**
```javascript
db.benefits.insertOne({
  benefitName: 'Premium Health Insurance',
  benefitType: 'Health',
  employerContribution: 100,
  employeeContribution: 0,
  companyId: ObjectId('YOUR_COMPANY_ID'),
  isActive: true
})
```

**Insert Sample Adjustment:**
```javascript
db.adjustments.insertOne({
  adjustmentName: 'Overtime Pay',
  adjustmentType: 'EARNING',
  fixedAmount: 500,
  isRecurring: false,
  isTaxable: true,
  companyId: ObjectId('YOUR_COMPANY_ID')
})
```

---

## DATABASE RELATIONSHIPS

```
Employee (1) ---> (M) EmployeeBenefit --> (M) Benefit
       |
       |--> (M) PaymentRecord
       
PaymentRecord uses Adjustment rules for calculations
```

---

## Next Steps After Implementation

1. **Create Services** for payroll calculation
2. **Implement RBAC Middleware** for access control
3. **Create Testing Suite** with Jest
4. **Build API endpoints** for all models
5. **Setup multi-tenancy validation** in middleware

---

## All 10 Models Status

✅ 1. Company (Root - multi-tenancy)
✅ 2. User (RBAC)
✅ 3. Department (HR)
✅ 4. Employee (Core - exists)
✅ 5. JobGrade (Salary bands)
✅ 6. Position (Job roles)
✅ 7. SalaryStructure (Compensation components)
✅ 8. CompensationDetail (Employee compensation)
✅ 9. Benefit (Benefits catalog)
✅ 10. EmployeeBenefit (Employee enrollment)
✅ 11. Adjustment (Earnings/Deductions)
✅ 12. PaymentRecord (Monthly payroll)

⏳ Still needed: LeaveRequest, Attendance, AuditLog
