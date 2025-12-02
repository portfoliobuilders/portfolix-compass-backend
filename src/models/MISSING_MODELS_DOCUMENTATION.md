# Missing Models Documentation - Relational Schema

## Overview
This document outlines the 8 missing models needed for complete HR/Payroll functionality with interconnected relational schema.

## Relational Schema Diagram
```
Company (root)
    ├── Users (RBAC)
    ├── Departments
    ├── Employees
    │   ├── SalaryStructure
    │   ├── OfferLetters
    │   ├── LeaveRequests
    │   └── Attendance
    ├── Payroll
    │   └── SalarySlips
    └── AuditLogs
```

## 1. Department Model
**File:** `Department.js`

**Relationships:**
- Belongs to: Company (multi-tenancy)
- Has many: Employees
- Has one: Manager (User reference)

**Fields:**
- id (ObjectId, Primary Key)
- name (String, required)
- code (String, unique per company)
- description (String)
- managerId (ObjectId, ref: User)
- companyId (ObjectId, ref: Company) **[TENANT KEY]**
- budget (Number)
- isActive (Boolean)
- createdAt, updatedAt (Timestamps)

**Indexes:**
- Compound: [companyId, code] (unique)
- [companyId, isActive]

---

## 2. SalaryStructure Model
**File:** `SalaryStructure.js`

**Relationships:**
- Belongs to: Company
- Has many: Employees
- Has many: Payrolls

**Fields:**
- id (ObjectId)
- name (String) - e.g., "Senior Developer", "Manager"
- companyId (ObjectId) **[TENANT KEY]**
- baseSalary (Number)
- da (Number) - Dearness Allowance
- hra (Number) - House Rent Allowance
- ta (Number) - Travel Allowance
- othersAllowances (Number)
- pf (Number) - Provident Fund percentage
- esi (Number) - Employee State Insurance
- tax (Number) - Income Tax
- deductions (Array of Strings)
- description (String)
- isActive (Boolean)
- createdAt, updatedAt

**Indexes:**
- [companyId, isActive]
- [companyId, name]

---

## 3. Payroll Model
**File:** `Payroll.js`

**Relationships:**
- Belongs to: Company, Employee, SalaryStructure
- Has many: SalarySlips

**Fields:**
- id (ObjectId)
- employeeId (ObjectId, ref: Employee) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- salaryStructureId (ObjectId, ref: SalaryStructure)
- month (Number, 1-12)
- year (Number)
- workingDays (Number)
- workingHours (Number)
- grossSalary (Number)
- deductions (Number)
- netSalary (Number)
- status (String) - DRAFT, APPROVED, PAID
- paidDate (Date)
- paymentMethod (String) - BANK_TRANSFER, CHEQUE, CASH
- bankTransferId (String)
- createdAt, updatedAt

**Indexes:**
- Compound unique: [companyId, employeeId, month, year]
- [companyId, status]
- [companyId, year, month]

---

## 4. SalarySlip Model
**File:** `SalarySlip.js`

**Relationships:**
- Belongs to: Company, Employee, Payroll

**Fields:**
- id (ObjectId)
- payrollId (ObjectId, ref: Payroll)
- employeeId (ObjectId, ref: Employee) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- month (Number)
- year (Number)
- earnings (Array) - [{component: 'DA', amount: 5000}, ...]
- deductions (Array) - [{component: 'PF', amount: 1200}, ...]
- grossSalary (Number)
- netSalary (Number)
- generatedAt (Date)
- pdfUrl (String) - Link to generated PDF
- status (String) - GENERATED, SENT, VIEWED, DOWNLOADED
- viewedAt (Date)
- downloadedAt (Date)
- createdAt, updatedAt

**Indexes:**
- [companyId, employeeId, month, year]
- [companyId, status]

---

## 5. OfferLetter Model
**File:** `OfferLetter.js`

**Relationships:**
- Belongs to: Company, Employee (one-to-one)

**Fields:**
- id (ObjectId)
- employeeId (ObjectId, unique, ref: Employee) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- position (String)
- department (String)
- reportingTo (String)
- salary (Number)
- currency (String) - default: INR
- startDate (Date)
- offerValidUntil (Date)
- employmentType (String) - FULL_TIME, CONTRACT, INTERN
- terms (Array of Strings)
- benefits (Array) - [{type: 'HEALTH_INSURANCE', details: '...'}]
- status (String) - DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- generatedAt (Date)
- sentAt (Date)
- acceptedAt (Date)
- pdfUrl (String)
- createdAt, updatedAt

**Indexes:**
- [companyId, employeeId]
- [companyId, status]

---

## 6. LeaveRequest Model
**File:** `LeaveRequest.js`

**Relationships:**
- Belongs to: Company, Employee
- References: Approver (User)

**Fields:**
- id (ObjectId)
- employeeId (ObjectId, ref: Employee) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- leaveType (String) - CASUAL, SICK, PERSONAL, MATERNITY, PATERNITY, BEREAVEMENT
- fromDate (Date)
- toDate (Date)
- days (Number) - calculated
- halfDay (Boolean)
- reason (String)
- attachments (Array of Strings) - URLs
- approverNotes (String)
- approverId (ObjectId, ref: User)
- status (String) - PENDING, APPROVED, REJECTED
- approvedAt (Date)
- createdAt, updatedAt

**Indexes:**
- [companyId, employeeId, status]
- [companyId, fromDate, toDate]

---

## 7. Attendance Model
**File:** `Attendance.js`

**Relationships:**
- Belongs to: Company, Employee

**Fields:**
- id (ObjectId)
- employeeId (ObjectId, ref: Employee) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- date (Date) - unique per employee per day
- status (String) - PRESENT, ABSENT, HALF_DAY, LEAVE, WFH (Work From Home)
- checkInTime (DateTime)
- checkOutTime (DateTime)
- hoursWorked (Number)
- location (String) - office, remote, site
- remarks (String)
- markedBy (ObjectId, ref: User) - HR who marks attendance
- markedAt (DateTime)
- createdAt, updatedAt

**Indexes:**
- Compound unique: [companyId, employeeId, date]
- [companyId, date]
- [employeeId, month, year]

---

## 8. AuditLog Model
**File:** `AuditLog.js`

**Relationships:**
- Belongs to: Company, User

**Fields:**
- id (ObjectId)
- userId (ObjectId, ref: User) **[FK]**
- companyId (ObjectId) **[TENANT KEY]**
- action (String) - CREATE, READ, UPDATE, DELETE, EXPORT, PRINT
- entityType (String) - Employee, Payroll, SalarySlip, LeaveRequest, Attendance
- entityId (String)
- entityName (String) - friendly name
- oldValues (Object) - JSON of previous values
- newValues (Object) - JSON of new values
- changes (Array) - [{field: 'salary', from: 50000, to: 55000}, ...]
- ipAddress (String)
- userAgent (String)
- status (String) - SUCCESS, FAILURE
- failureReason (String)
- timestamp (DateTime, default: now)

**Indexes:**
- [companyId, timestamp] (for audit trails)
- [userId, timestamp]
- [entityType, entityId]

---

## Relational Constraints

### Cascading Deletes
- Deleting Company → Cascade delete all related records (Users, Departments, Employees, Payrolls, etc.)
- Deleting Employee → Cascade delete related LeaveRequests, Attendance, SalarySlips, OfferLetters
- Deleting Department → Set managerId to NULL but keep employees (reassign them)

### Unique Constraints
- SalaryStructure: [companyId + name]
- Payroll: [companyId + employeeId + month + year]
- Attendance: [companyId + employeeId + date]
- OfferLetter: [employeeId] - one per employee

### Referential Integrity
- All employeeId references must exist in Employee collection
- All userId references must exist in User collection
- All companyId must exist in Company collection
- All salaryStructureId must exist in SalaryStructure collection

## Migration Strategy

1. Create indexes first (performance critical)
2. Populate SalaryStructure from existing salary configurations
3. Migrate Payroll data with existing records
4. Create SalarySlip records from Payroll history
5. Initialize Department structure
6. Setup User roles and permissions
7. Enable audit logging
8. Validate referential integrity

## Multi-Tenancy Implementation

Every document includes `companyId` field for tenant isolation:
- Query filtering: Always include `{companyId: req.user.companyId}`
- Indexes: Always compound with `companyId` first
- Middleware: Auto-inject tenant from JWT token
- Validation: Ensure all cross-entity queries match tenant
