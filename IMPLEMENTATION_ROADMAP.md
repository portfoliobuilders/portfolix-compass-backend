# Portfolix Compass Backend - Implementation Roadmap

This document provides a comprehensive guide for implementing the complete backend for Portfolix Compass Salary & Compensation Management System. Follow this roadmap sequentially to build a production-grade backend.

---

## Phase 1: Configuration & Setup (COMPLETED)

- [x] package.json - Dependencies and scripts
- [x] src/server.js - Express app entry point with middleware stack
- [x] .env.example - Environment variables template
- [x] prisma/schema.prisma - Complete database schema
- [x] BACKEND_STRUCTURE.md - Architecture documentation

---

## Phase 2: Core Configuration Files

### 2.1 src/config/database.js
Prisma client initialization and connection pooling configuration.

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

prisma.$connect().then(() => {
  console.log('Database connected successfully');
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

module.exports = prisma;
```

### 2.2 src/config/constants.js
Application constants including error codes, status enums, and role definitions.

```javascript
const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  FINANCE: 'FINANCE',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
};

const SALARY_TYPES = {
  STANDARD: 'STANDARD',
  SALES: 'SALES',
};

const CAREER_STAGES = {
  PROBATION: 'PROBATION',
  ESTABLISHED: 'ESTABLISHED',
};

const PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  CALCULATED: 'CALCULATED',
  APPROVED: 'APPROVED',
  PROCESSED: 'PROCESSED',
  PAID: 'PAID',
  ARCHIVED: 'ARCHIVED',
};

const OFFER_LETTER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  INACTIVE: 'INACTIVE',
  TERMINATED: 'TERMINATED',
};

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  CONFLICT: 'CONFLICT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

module.exports = {
  ROLES,
  SALARY_TYPES,
  CAREER_STAGES,
  PAYROLL_STATUS,
  OFFER_LETTER_STATUS,
  EMPLOYEE_STATUS,
  ERROR_CODES,
};
```

### 2.3 src/config/taxConfig.js
Tax configuration with Kerala Professional Tax slabs.

```javascript
const PT_SLABS = [
  { min: 0, max: 10000, rate: 0 },
  { min: 10001, max: 20000, rate: 1 },
  { min: 20001, max: Infinity, rate: 2, cap: 2500 },
];

const TAX_CONFIG = {
  PT_SLABS,
  ESI_RATE: 0.0075,
  PF_RATE: 0.12,
  ESI_APPLICABLE_LIMIT: 21000,
};

module.exports = TAX_CONFIG;
```

---

## Phase 3: Middleware Layer

### 3.1 src/middlewares/auth.middleware.js
JWT token verification and user authentication.

### 3.2 src/middlewares/validation.middleware.js
Input validation using joi schemas.

### 3.3 src/middlewares/error-handler.middleware.js
Centralized error handling with standardized response format.

### 3.4 src/middlewares/rbac.middleware.js
Role-Based Access Control enforcement.

### 3.5 src/middlewares/logger.middleware.js
Request/response logging and audit trail.

---

## Phase 4: Core Services

### 4.1 SalaryCalculationService
Implements salary calculation logic:
- Standard salary: Basic + HRA + DA + Allowances - Deductions
- Sales salary: Fixed + Commission (tiered) + Bonuses + Referral bonuses

### 4.2 TaxCalculationService
Computes Kerala Professional Tax, PF, ESI, Income Tax.

### 4.3 PayrollService
Manages payroll workflow: DRAFT → CALCULATED → APPROVED → PROCESSED → PAID

### 4.4 PdfGeneratorService
Generates Salary Slips and Offer Letters using Puppeteer.

### 4.5 EmailService
Sends emails via SendGrid for notifications and documents.

### 4.6 ExcelExportService
Exports payroll data and reports to Excel format.

### 4.7 OfferLetterService
Generates and manages offer letters with CTC breakdown.

---

## Phase 5: Controllers

Request handlers for each module:
- authController - Login, refresh token
- employeeController - CRUD operations for employees
- salarySlipController - Generate and retrieve salary slips
- payrollController - Manage payroll records
- offerLetterController - Create and manage offer letters
- taxConfigController - Configure tax slabs
- dashboardController - Analytics and reporting

---

## Phase 6: Routes

API endpoints organized by module:
- POST /auth/login - User authentication
- GET /employees - List employees (with pagination)
- POST /employees - Create employee
- GET /employees/:id - Get employee details
- POST /salary-slips - Generate salary slip
- GET /salary-slips/:id - Retrieve salary slip
- POST /payroll - Create payroll record
- PATCH /payroll/:id/approve - Approve payroll
- POST /offer-letters - Create offer letter
- GET /offer-letters/:id - Retrieve offer letter
- And 30+ more endpoints as per IA

---

## Phase 7: Tests

Unit and integration tests for:
- Salary calculation logic
- Tax calculations
- API endpoints
- Authentication and authorization
- Database operations

---

## Phase 8: Deployment

- Docker containerization
- CI/CD pipeline configuration
- Production environment setup
- Database migrations

---

## Database Schema Reference

Key models in prisma/schema.prisma:

1. **User** - Application users with roles and authentication
2. **Company** - Multi-tenant company data
3. **Employee** - Employee master data
4. **SalaryStructure** - Salary configuration per employee
5. **PayrollRecord** - Monthly payroll processing records
6. **SalarySlip** - Generated salary slips
7. **OfferLetter** - Employment offer letters
8. **CommissionTier** - Sales commission tier definitions
9. **SalesPerformance** - Sales performance metrics
10. **PTSlab** - Professional tax slab configuration
11. **AuditLog** - Complete audit trail

---

## Salary Calculation Formulas

### Standard Salary Calculation
```
Gross = Basic + HRA + DA + AllowancesTotal
Deductions = PF + PT + IT + ESI
NetSalary = Gross - Deductions
```

### Sales Salary Calculation
```
Fixed = BasicSalary + Allowances
Commission = CalculateByTiers(SalesCount)
Bonuses = ProbationBonus + MilestoneBonus
ReferralBonus = Sum(UpTo4Referrals)
Gross = Fixed + Commission + Bonuses + ReferralBonus
Deductions = PF + PT + IT + ESI
NetSalary = Gross - Deductions
```

### Kerala Professional Tax
```
If Income <= 10,000: PT = 0
If 10,001 <= Income <= 20,000: PT = Income * 1%
If Income > 20,000: PT = min(Income * 2%, 2,500)
```

---

## Security Checklist

- [ ] JWT tokens with 24h expiry and 7d refresh
- [ ] Password hashing with bcrypt
- [ ] Encryption for sensitive fields (bank details, PAN, Aadhar)
- [ ] HTTPS enforced in production
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled (900s window, 100 requests)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention via Prisma ORM
- [ ] XSS protection via helmet
- [ ] CSRF tokens for state-changing operations
- [ ] Secure session management
- [ ] Audit logging for sensitive operations

---

## API Response Format

All API responses follow this standardized format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-02T10:30:00Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "timestamp": "2025-01-02T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

---

## Environment Variables

See .env.example for complete list. Key variables:
- DATABASE_URL - PostgreSQL connection string
- JWT_SECRET - Secret for signing tokens
- JWT_EXPIRY - Token expiration time (default: 24h)
- SENDGRID_API_KEY - Email service API key
- AWS_ACCESS_KEY_ID - AWS S3 access key
- AWS_SECRET_ACCESS_KEY - AWS S3 secret key
- AWS_S3_BUCKET - S3 bucket name
- NODE_ENV - Environment (development/production)

---

## Development Workflow

1. **Setup**
   ```bash
   npm install
   cp .env.example .env
   npx prisma migrate dev --name init
   ```

2. **Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Code Quality**
   ```bash
   npm run lint
   npm run format
   ```

---

## Testing Strategy

1. **Unit Tests** - Services and utility functions
2. **Integration Tests** - Database operations and API endpoints
3. **E2E Tests** - Complete workflows (salary calculation → payroll processing)
4. **Load Tests** - Performance under concurrent requests

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CORS whitelist updated
- [ ] Rate limiting configured
- [ ] Logging and monitoring setup
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Security audit completed
- [ ] Load balancer configured

---

## Next Steps

Proceed with Phase 2 configuration files creation in the following order:
1. src/config/database.js
2. src/config/constants.js
3. src/config/taxConfig.js

Then continue with middleware layer and core services.
