# Complete Relational Schema Models - Implementation Guide

## CORE HR TABLES - Ready to Implement

### 1. EMPLOYEES TABLE (Already Exists - Extend)
Ensure Employee.js includes:
- EmployeeID (Primary Key - auto-generated)
- FirstName, LastName
- DateOfBirth, DateOfHire
- ContactInfo (Address, Phone, Email)
- DepartmentID (FK to Departments)
- PositionID (FK to Positions)
- ManagerID (Self-referencing FK)
- Status (ACTIVE, INACTIVE, RESIGNED)
- HireDate, TerminationDate

### 2. DEPARTMENTS TABLE - CREATE as Department.js
- DepartmentID (PK)
- DepartmentName
- ManagerID (FK to Employees - optional self-reference)
- Budget (Decimal)
- IsActive (Boolean)
- CreatedAt, UpdatedAt

### 3. POSITIONS TABLE - CREATE as Position.js
- PositionID (PK)
- PositionTitle (e.g., "Senior Developer")
- Description
- JobGradeID (FK to JobGrades)
- ReportsTo (PositionID - nullable, for org hierarchy)
- CompanyID (for multi-tenancy)
- IsActive (Boolean)
- CreatedAt, UpdatedAt

### 4. JOBBANDS/SALARY BANDS TABLE - CREATE as JobGrade.js
- JobGradeID (PK)
- GradeName (e.g., "Grade-A", "Senior")
- MinSalary (Decimal)
- MidSalary (Decimal)
- MaxSalary (Decimal)
- Currency (default: INR)
- CompanyID (FK)
- EffectiveFrom, EffectiveTo (Date)
- IsActive (Boolean)
- CreatedAt, UpdatedAt

## COMPENSATION & PAYROLL TABLES - Ready to Implement

### 5. COMPENSATION DETAILS TABLE - CREATE as CompensationDetail.js
- CompID (PK)
- EmployeeID (FK to Employees)
- BaseSalary (Decimal)
- PayFrequency (Weekly, BiWeekly, Monthly)
- EffectiveStartDate (Date)
- EffectiveEndDate (Date - nullable)
- CompanyID (FK)
- CreatedBy, UpdatedBy
- CreatedAt, UpdatedAt

### 6. BENEFITS TABLE - CREATE as Benefit.js
- BenefitID (PK)
- BenefitType (Health Insurance, Dental, Retirement, 401k, Stock Options)
- BenefitName (e.g., "Premium Health Plan")
- Description
- EmployerContribution (Decimal, percentage)
- EmployeeContribution (Decimal, percentage)
- IsActive (Boolean)
- CompanyID (FK)
- CreatedAt, UpdatedAt

### 7. EMPLOYEE BENEFITS TABLE - CREATE as EmployeeBenefit.js
- EmpBenefitID (PK)
- EmployeeID (FK to Employees)
- BenefitID (FK to Benefits)
- EnrollmentDate (Date)
- CoverageStartDate (Date)
- CoverageEndDate (Date - nullable)
- CoverageAmount (Decimal - for insurance)
- IsCovered (Boolean)
- CompanyID (FK)
- CreatedAt, UpdatedAt

### 8. ADJUSTMENTS TABLE - CREATE as Adjustment.js
- AdjustmentID (PK)
- AdjustmentName (e.g., "Overtime Pay", "Tax Deduction")
- AdjustmentType (Enum: EARNING, DEDUCTION)
- Description
- Frequency (One-time, Recurring)
- PercentageRate (Decimal - for percentage-based)
- FixedAmount (Decimal - for fixed amount)
- IsTaxable (Boolean)
- IsRecurring (Boolean)
- CompanyID (FK)
- AppliesFrom (Date)
- AppliesUntil (Date - nullable)
- CreatedAt, UpdatedAt

### 9. SALARY PAYMENTS / PAYROLL LOG - CREATE as PaymentRecord.js or SalaryPayment.js
- PaymentID (PK)
- EmployeeID (FK to Employees)
- PayPeriodStartDate (Date)
- PayPeriodEndDate (Date)
- BaseSalary (Decimal)
- Allowances (Decimal, breakdown of DA+HRA+TA+Others)
- GrossSalary (Decimal = BaseSalary + Allowances)
- TaxDeduction (Decimal)
- ProvidentFund (Decimal)
- OtherDeductions (Decimal)
- NetSalary (Decimal = GrossSalary - Total Deductions)
- PaymentDate (Date)
- PaymentMethod (BANK_TRANSFER, CHEQUE, CASH)
- PaymentStatus (PENDING, PROCESSED, PAID, FAILED)
- TransactionID (String - reference from bank)
- CompanyID (FK)
- ProcessedBy (FK to Users)
- Remarks (Text)
- CreatedAt, UpdatedAt

## IMPLEMENTATION PRIORITY ORDER

1. **JobGrade.js** (Foundation for salary bands)
2. **Position.js** (Links to JobGrades)
3. **Adjustment.js** (Earnings/Deductions configuration)
4. **CompensationDetail.js** (Employee base compensation)
5. **Benefit.js** (Benefits catalog)
6. **EmployeeBenefit.js** (Employee-specific benefits)
7. **PaymentRecord.js** (Actual payroll records)
8. **LeaveRequest.js** (Leave management)
9. **Attendance.js** (Attendance tracking)
10. **AuditLog.js** (Compliance audit trail)

## Key Relationships

```
Employee (1) ---> (1) CompensationDetail
       |
       |--> (M) EmployeeBenefit --> (M) Benefit
       |
       |--> (M) PaymentRecord
       |
       |--> (M) LeaveRequest
       |
       |--> (M) Attendance
       |
       +--> (1) Position --> (1) JobGrade
           
Department (1) --> (M) Employee

JobGrade defines salary ranges for Positions
Adjustment table applies rules to PaymentRecords
```

## Multi-Tenancy Pattern (companyId on ALL tables)

Every table MUST include:
- `companyId` (ObjectId, FK to Company, required)
- Index: `[companyId, id]` for query optimization
- Query filter: Always `{companyId: req.user.companyId}`

## Data Validation Rules

- MaxSalary >= MidSalary >= MinSalary (in JobGrade)
- NetSalary = GrossSalary - TotalDeductions (PaymentRecord)
- EffectiveEndDate >= EffectiveStartDate
- CoverageEndDate >= CoverageStartDate
- PayPeriodEndDate > PayPeriodStartDate

## Indexes for Performance

- PaymentRecord: [companyId, employeeId, payPeriodStartDate]
- EmployeeBenefit: [companyId, employeeId, isActive]
- Adjustment: [companyId, adjustmentType, isRecurring]
- Employee: [companyId, departmentId, status]
- Position: [companyId, jobGradeId]
