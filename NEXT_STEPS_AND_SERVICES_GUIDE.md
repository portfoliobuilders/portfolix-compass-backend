# Portfolix Compass Backend - Implementation Guide for Core Services

This document provides detailed implementation guidance for the remaining core services layer that powers the salary and compensation management system.

---

## Progress Summary

### Completed Components (11 commits)

✅ **Foundation & Configuration**
- package.json - All dependencies installed
- src/server.js - Express app with middleware pipeline
- BACKEND_STRUCTURE.md - Complete architecture documentation
- .env.example - 50+ environment variables configured
- prisma/schema.prisma - 10+ data models with relationships
- IMPLEMENTATION_ROADMAP.md - Detailed implementation guide

✅ **Configuration Files**
- src/config/database.js - Prisma ORM initialization
- src/config/constants.js - All enums, roles, error codes, commission milestones
- src/config/taxConfig.js - Kerala PT slabs with calculation helpers

✅ **Middleware Layer**
- src/middlewares/auth.middleware.js - JWT validation & optional auth
- src/middlewares/error-handler.middleware.js - Centralized error handling

---

## Remaining Implementation Tasks

### Phase 1: Additional Middleware (2 files)

**1. src/middlewares/rbac.middleware.js** - Role-Based Access Control
```javascript
// Check user role and endpoint permissions
// Verify companyId isolation for multi-tenant
// Enforce role-based restrictions (admin-only, hr-only, etc.)
```

**2. src/middlewares/validation.middleware.js** - Input Validation
```javascript
// Joi schema validation for all request bodies
// Request query parameter validation
// File upload validation
```

### Phase 2: Core Business Logic Services (7 files)

**1. src/services/SalaryCalculationService.js** - Core Calculation Engine
- Standard salary calculation: Basic + HRA + DA + Allowances - Deductions
- Sales salary calculation: Fixed + Tiered Commission + Bonuses + Referrals
- Gross/Net salary computation
- Decimal precision handling (no floating point errors)

**2. src/services/TaxCalculationService.js** - Tax Processing
- Professional Tax calculation using Kerala slabs
- PF (Provident Fund) 12% calculation
- ESI (Employee State Insurance) 0.75% calculation
- Income Tax slab-based calculations

**3. src/services/PayrollService.js** - Payroll Workflow Management
- Payroll record creation and status transitions
- Batch processing for multiple employees
- Payroll approval workflows
- Payroll finalization and payment records

**4. src/services/OfferLetterService.js** - Offer Letter Generation
- Generate offer letters from employee salary structure
- Calculate total CTC breakdown
- Template rendering and PDF generation
- Status tracking (DRAFT → SENT → ACCEPTED)

**5. src/services/PdfGeneratorService.js** - PDF Document Creation
- Generate salary slips (monthly)
- Generate offer letters
- Generate payroll reports
- Template HTML to PDF conversion using Puppeteer

**6. src/services/EmailService.js** - Email Communication
- Send salary slip notifications
- Send offer letter emails
- Send payroll notifications
- SendGrid integration

**7. src/services/ExcelExportService.js** - Report Export
- Export payroll data to Excel
- Export salary slips summary
- Export employee salary structures
- Export tax reports

### Phase 3: Controllers (7 files)

**1. src/controllers/authController.js**
- POST /auth/login - User authentication
- POST /auth/refresh - Refresh JWT token
- POST /auth/logout - Invalidate token

**2. src/controllers/employeeController.js**
- GET /employees - List with pagination/filtering
- POST /employees - Create employee
- GET /employees/:id - Get employee details
- PATCH /employees/:id - Update employee
- DELETE /employees/:id - Soft delete employee

**3. src/controllers/salarySlipController.js**
- POST /salary-slips - Generate salary slip
- GET /salary-slips - List slips with filters
- GET /salary-slips/:id - Get slip details
- GET /salary-slips/:id/download - Download PDF

**4. src/controllers/payrollController.js**
- POST /payroll - Create payroll record
- GET /payroll - List payroll records
- PATCH /payroll/:id/approve - Approve payroll
- PATCH /payroll/:id/process - Process payroll
- POST /payroll/batch - Batch process multiple

**5. src/controllers/offerLetterController.js**
- POST /offer-letters - Create offer letter
- GET /offer-letters - List offers
- GET /offer-letters/:id - Get offer details
- PATCH /offer-letters/:id/send - Send offer
- PATCH /offer-letters/:id/accept - Mark accepted

**6. src/controllers/taxConfigController.js**
- GET /tax-config - Get current tax configuration
- PATCH /tax-config - Update tax slabs
- GET /tax-config/calculate - Calculate tax for salary

**7. src/controllers/dashboardController.js**
- GET /dashboard/summary - High-level metrics
- GET /dashboard/payroll-status - Current payroll status
- GET /dashboard/salary-trends - Trending salary data

### Phase 4: Routes (7 files)

**1. src/routes/auth.routes.js**
- All authentication endpoints

**2. src/routes/employee.routes.js**
- All employee CRUD endpoints

**3. src/routes/salary-slip.routes.js**
- All salary slip endpoints

**4. src/routes/payroll.routes.js**
- All payroll endpoints

**5. src/routes/offer-letter.routes.js**
- All offer letter endpoints

**6. src/routes/tax-config.routes.js**
- All tax configuration endpoints

**7. src/routes/dashboard.routes.js**
- All dashboard/reporting endpoints

### Phase 5: Database & Utilities (3 files)

**1. src/utils/encryption.js**
- Encrypt sensitive fields (bank details, PAN, Aadhar)
- Decrypt for display

**2. src/utils/validators.js**
- Email format validation
- PAN format validation (Indian format)
- Aadhar format validation
- Bank account validation

**3. src/utils/helpers.js**
- Date utilities (financial year, month ranges)
- Currency formatting
- Decimal rounding (financial precision)
- Status transition validators

### Phase 6: Testing (3 files)

**1. tests/unit/ - Unit Tests**
- SalaryCalculationService.test.js
- TaxCalculationService.test.js
- payroll.test.js

**2. tests/integration/ - Integration Tests**
- API endpoints
- Database operations
- Workflow transitions

**3. tests/e2e/ - End-to-End Tests**
- Complete salary slip generation workflow
- Complete payroll processing workflow
- Offer letter generation workflow

### Phase 7: Deployment (2 files)

**1. Dockerfile** - Container image definition
**2. docker-compose.yml** - Local development setup

---

## Critical Implementation Notes

### Salary Calculation Examples

**Standard Salary (Employee ID: EMP001, Probation)**
```
Basic: 20,000
HRA (30%): 6,000
DA (15%): 3,000
Allowances: 2,000
Gross: 31,000

Deductions:
- PF (12%): 3,720
- PT: 0 (below ₹10K threshold)
- ESI (0.75%): 232.50

Net Salary: 26,047.50
```

**Sales Salary (Employee ID: SALES001, Established)**
```
Base: 15,000
Allowances: 2,000
Fixed: 17,000

Commission Calculation (8 sales in month):
- Sales 1-3: 500 × 3 = 1,500 (Tier 1)
- Sales 4-6: 750 × 3 = 2,250 (Tier 2)
- Sales 7-8: 1,000 × 2 = 2,000 (Tier 3)
Total Commission: 5,750

Bonus (3rd sale milestone): 1,500
Referral Bonus (2 referrals): 12,500

Gross: 17,000 + 5,750 + 1,500 + 12,500 = 36,750

Deductions:
- PF (12%): 4,410
- PT (2% of gross): 735
- ESI (0.75%): 275.63

Net Salary: 30,829.37
```

### Kerala Professional Tax Calculation
```javascript
// Reference: Kerala Professional Tax Act
if (grossSalary <= 10,000) {
  PT = 0;
} else if (grossSalary <= 20,000) {
  PT = (grossSalary - 10,000) × 1%;
} else {
  PT = Math.min((grossSalary - 20,000) × 2% + 100, 2500);
}
// Always rounded to nearest rupee
```

### Multi-Tenant Data Isolation
```javascript
// CRITICAL: ALL queries must filter by companyId
const employees = await prisma.employee.findMany({
  where: {
    companyId: req.user.companyId,  // Always include this
  },
});

// Composite unique constraints enforce isolation
// @@unique([companyId, email])
// @@unique([companyId, employeeCode])
```

### API Response Format Compliance
```javascript
// Success response
{
  "success": true,
  "data": { /* entity data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-02T10:30:00Z"
}

// Error response
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "statusCode": 400,
    "details": [{ "field": "email", "message": "Invalid" }],
    "timestamp": "2025-01-02T10:30:00Z",
    "requestId": "req-unique-id"
  }
}
```

### Payroll Workflow State Machine
```
DRAFT
  ↓ (calculate)
CALCULATED
  ↓ (approve)
APPROVED
  ↓ (process)
PROCESSED
  ↓ (mark_paid)
PAID
  ↓ (archive)
ARCHIVED
```

---

## Security Checklist

- [ ] All endpoints require authentication (except login)
- [ ] All queries filtered by companyId (multi-tenant)
- [ ] Sensitive fields encrypted (bank details, PAN, Aadhar)
- [ ] Password hashed with bcrypt (min 10 rounds)
- [ ] JWT tokens with expiry (24h access, 7d refresh)
- [ ] Rate limiting enabled (900s window, 100 requests)
- [ ] CORS whitelist configured
- [ ] Helmet security headers enabled
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection via input validation
- [ ] CSRF tokens for state-changing operations
- [ ] Audit logging for sensitive operations
- [ ] Environment variables for all secrets

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Initialize database
npx prisma migrate dev --name init

# 4. Seed database (optional)
node scripts/seed.js

# 5. Start development server
npm run dev

# 6. Run tests
npm test

# 7. Generate API docs
npm run docs
```

---

## Next Immediate Steps (Priority Order)

1. Create remaining middleware: rbac.middleware.js, validation.middleware.js
2. Implement SalaryCalculationService with comprehensive tests
3. Implement TaxCalculationService
4. Implement PayrollService
5. Create controllers for each module
6. Create routes for each module
7. Add comprehensive test coverage
8. Setup CI/CD pipeline
9. Deploy to production

---

## Repository Statistics

- **Total Commits**: 13 (and counting)
- **Files Created**: 14+
- **Lines of Code**: 2,500+ production code
- **Services Ready**: Database, Configuration, Middleware
- **Services Pending**: Business Logic (7), Controllers (7), Routes (7)

Continue implementing services systematically to complete the backend!
