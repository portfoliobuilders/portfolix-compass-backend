# 🎯 Portfolix Compass Backend

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production-brightgreen.svg)

**Enterprise-grade Salary & Compensation Management System API**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-system-architecture) • [API](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Performance](#-performance)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Portfolix Compass Backend** is a production-ready Node.js/Express REST API designed for comprehensive salary, payroll, and compensation management. Built for Portfolio Builders' edtech ecosystem, it serves as the backbone for managing employee compensation, generating salary slips, processing payroll, and ensuring tax compliance across India.

### Use Cases

- **HR Management**: Centralized employee data and compensation records
- **Payroll Processing**: Automated monthly payroll with tax calculations
- **Salary Slip Generation**: PDF generation with company branding
- **Offer Letter Management**: Template-based offer letter creation
- **Tax Compliance**: Kerala Professional Tax and PF/ESI calculations
- **Multi-tenant Support**: Manage multiple companies/organizations
- **Compensation Analytics**: Reports and insights on salary structures

---

## ⚡ Key Features

### Core Functionality
- ✅ **Multi-tenant Architecture** - Isolated data for multiple organizations
- ✅ **Employee Master Data Management** - Complete CRUD operations
- ✅ **Salary Structure Builder** - Flexible component-based salary definitions
- ✅ **Automated Payroll Processing** - Bulk payroll runs with validation
- ✅ **Salary Slip Generator** - Professional PDF generation with branding
- ✅ **Offer Letter Templates** - Customizable offer letter creation
- ✅ **Tax Calculation Engine** - Kerala Professional Tax & Income Tax
- ✅ **Statutory Compliance** - PF, ESI, Professional Tax calculations
- ✅ **Payroll Register** - Month-wise payroll reports
- ✅ **Excel Export** - Download payroll data in Excel format

### Security & Performance
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🔐 **Role-Based Access Control (RBAC)** - Admin, HR, Employee, Viewer roles
- 🔐 **Data Encryption** - Sensitive field encryption at rest
- 🔐 **Rate Limiting** - API abuse prevention
- 🔐 **Input Validation** - Joi schema validation
- ⚡ **Redis Caching** - Performance optimization
- ⚡ **Database Indexing** - Optimized query performance
- ⚡ **Batch Processing** - Efficient bulk operations

### Developer Experience
- 📚 **OpenAPI Documentation** - Auto-generated API docs
- 📚 **Postman Collections** - Pre-configured API testing
- 🧪 **Comprehensive Testing** - Unit and integration tests
- 🔍 **Error Tracking** - Sentry integration
- 📊 **Logging** - Winston-based structured logging
- 🐳 **Docker Support** - Containerized deployment
- 🚀 **CI/CD Ready** - GitHub Actions workflows

---

## 🛠️ Technology Stack

### Core Technologies
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | ≥16.0.0 | JavaScript runtime |
| **Framework** | Express.js | ^4.18.2 | Web application framework |
| **Database** | MongoDB | ^7.0 | Primary data store |
| **ORM** | Mongoose | ^7.5.0 | MongoDB ODM |
| **Cache** | Redis | ^7.0 | Caching layer |

### Security & Authentication
| Library | Version | Purpose |
|---------|---------|---------|
| jsonwebtoken | ^9.1.0 | JWT token generation |
| bcryptjs | ^2.4.3 | Password hashing |
| helmet | ^7.1.0 | Security headers |
| cors | ^2.8.5 | Cross-origin resource sharing |
| joi | ^17.11.0 | Input validation |

### Utilities
| Library | Version | Purpose |
|---------|---------|---------|
| pdfkit | ^0.13.0 | PDF generation |
| node-xlsx | ^0.21.1 | Excel export |
| moment | ^2.29.4 | Date manipulation |
| lodash | ^4.17.21 | Utility functions |
| winston | ^3.11.0 | Logging |
| dotenv | ^16.3.1 | Environment management |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| nodemon | ^3.0.1 | Development server |
| jest | ^29.7.0 | Testing framework |
| supertest | ^6.3.3 | API testing |
| eslint | ^8.49.0 | Code linting |
| prettier | ^3.0.3 | Code formatting |

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Applications                     │
│  (Web App, Mobile App, Admin Dashboard, HR Portal)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway / Load Balancer               │
│                    (NGINX / AWS ALB)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Express.js Application Server                  │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │ Middleware   │ Routes       │ Controllers          │   │
│  │ Layer        │ Layer        │ Layer                │   │
│  ├──────────────┼──────────────┼──────────────────────┤   │
│  │ - Auth       │ - /auth      │ - Business Logic     │   │
│  │ - Validation │ - /employees │ - Data Processing    │   │
│  │ - Rate Limit │ - /payroll   │ - Response Building  │   │
│  │ - Logger     │ - /reports   │                      │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────┴──────────────────────┐           │
│  │           Services Layer                     │           │
│  │  - Salary Calc  - Tax Calc  - PDF Gen       │           │
│  │  - Email        - Excel     - Validation     │           │
│  └──────────────────────────────────────────────┘           │
└────────────────────┬────────────────┬───────────────────────┘
                     │                │
        ┌────────────▼────────┐      │
        │   MongoDB Atlas     │      │
        │  (Primary Database) │      │
        └─────────────────────┘      │
                                      │
                         ┌────────────▼────────┐
                         │   Redis Cache       │
                         │ (Session & Cache)   │
                         └─────────────────────┘
```

### Project Structure

```
portfolix-compass-backend/
│
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.js         # MongoDB connection
│   │   ├── redis.js            # Redis configuration
│   │   ├── constants.js        # App constants
│   │   └── swagger.js          # API documentation config
│   │
│   ├── models/                 # Database models (Mongoose schemas)
│   │   ├── Company.js          # Organization/tenant model
│   │   ├── User.js             # User authentication
│   │   ├── Employee.js         # Employee master data
│   │   ├── SalaryStructure.js  # Salary components
│   │   ├── SalarySlip.js       # Generated salary slips
│   │   ├── PayrollRegister.js  # Payroll batches
│   │   ├── OfferLetter.js      # Offer letter templates
│   │   ├── TaxConfiguration.js # Tax rules & slabs
│   │   └── AuditLog.js         # Audit trail
│   │
│   ├── routes/                 # API route definitions
│   │   ├── auth.routes.js      # Authentication endpoints
│   │   ├── employee.routes.js  # Employee operations
│   │   ├── salarySlip.routes.js# Salary slip generation
│   │   ├── payroll.routes.js   # Payroll processing
│   │   ├── offerLetter.routes.js# Offer letters
│   │   ├── taxConfig.routes.js # Tax configuration
│   │   ├── compensation.routes.js# Compensation planning
│   │   ├── reports.routes.js   # Report generation
│   │   └── company.routes.js   # Company management
│   │
│   ├── controllers/            # Request handlers
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── salarySlipController.js
│   │   ├── payrollController.js
│   │   ├── offerLetterController.js
│   │   ├── taxController.js
│   │   ├── compensationController.js
│   │   ├── reportController.js
│   │   └── companyController.js
│   │
│   ├── services/               # Business logic layer
│   │   ├── salaryCalcService.js    # Core salary calculations
│   │   ├── taxCalcService.js       # Tax calculation engine
│   │   ├── pdfGeneratorService.js  # PDF generation
│   │   ├── emailService.js         # Email notifications
│   │   ├── excelExportService.js   # Excel exports
│   │   ├── payrollService.js       # Payroll processing
│   │   ├── cacheService.js         # Redis caching
│   │   └── validationService.js    # Business validations
│   │
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── rbac.middleware.js      # Role-based access
│   │   ├── validation.middleware.js# Request validation
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── logger.middleware.js    # Request logging
│   │   └── errorHandler.middleware.js# Error handling
│   │
│   ├── utils/                  # Utility functions
│   │   ├── dateUtils.js        # Date helpers
│   │   ├── numberUtils.js      # Number formatting
│   │   ├── validators.js       # Custom validators
│   │   ├── encryption.js       # Data encryption
│   │   └── responseBuilder.js  # Standardized responses
│   │
│   ├── scripts/                # Maintenance scripts
│   │   ├── seedDatabase.js     # Database seeding
│   │   ├── migrate.js          # Database migrations
│   │   └── backup.js           # Backup utility
│   │
│   └── server.js               # Application entry point
│
├── tests/                      # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── fixtures/               # Test data
│   └── setup.js                # Test configuration
│
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture guide
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── CONTRIBUTING.md         # Contribution guidelines
│
├── docker/                     # Docker configurations
│   ├── Dockerfile              # Application container
│   ├── docker-compose.yml      # Multi-container setup
│   └── nginx.conf              # NGINX configuration
│
├── .github/                    # GitHub configurations
│   └── workflows/              # CI/CD pipelines
│       ├── test.yml            # Test automation
│       ├── deploy.yml          # Deployment
│       └── security.yml        # Security scanning
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── package.json                # Dependencies
├── package-lock.json           # Locked dependencies
├── jest.config.js              # Jest configuration
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** ≥ 16.0.0 ([Download](https://nodejs.org/))
- **MongoDB** ≥ 7.0 ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** ≥ 7.0 (Optional but recommended - [Download](https://redis.io/download))
- **npm** ≥ 8.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/portfoliobuilders/portfolix-compass-backend.git
cd portfolix-compass-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Edit .env file with your configuration
# Update MongoDB URI, JWT secret, Redis URL, etc.
nano .env  # or use your preferred editor

# 5. (Optional) Seed database with sample data
npm run seed

# 6. Start development server
npm run dev
```

The server will start at `http://localhost:3000`

### Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"2025-12-02T09:23:00.000Z"}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory. See `.env.example` for all available options.

#### Essential Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/portfolix-compass

# Authentication
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRY=24h

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

#### Production Variables

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.portfolix.in

# Database (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolix

# Security
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-32-char-hex-key>

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=warn

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@portfolix.in

# Redis
REDIS_URL=redis://username:password@redis-host:6379
```

### Configuration Files

- **Database**: `src/config/database.js`
- **Tax Slabs**: `src/config/taxConfig.js`
- **Constants**: `src/config/constants.js`
- **Swagger**: `src/config/swagger.js`

---

## 📡 API Reference

### Base URL

```
Development: http://localhost:3000/api
Production:  https://api.portfolix.in/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### Authentication

```http
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
POST   /api/auth/refresh       # Refresh access token
POST   /api/auth/logout        # Logout user
POST   /api/auth/forgot-password # Request password reset
POST   /api/auth/reset-password   # Reset password
```

#### Employee Management

```http
GET    /api/employees          # List all employees (paginated)
POST   /api/employees          # Create new employee
GET    /api/employees/:id      # Get employee by ID
PUT    /api/employees/:id      # Update employee
DELETE /api/employees/:id      # Delete employee
GET    /api/employees/:id/salary-history # Get salary history
POST   /api/employees/bulk     # Bulk import employees
```

#### Salary Slips

```http
POST   /api/salary-slips/generate    # Generate salary slip
GET    /api/salary-slips              # List salary slips
GET    /api/salary-slips/:id          # Get salary slip details
GET    /api/salary-slips/:id/download # Download PDF
PUT    /api/salary-slips/:id/approve  # Approve salary slip
DELETE /api/salary-slips/:id          # Delete salary slip
```

#### Payroll Processing

```http
POST   /api/payroll/process          # Process monthly payroll
GET    /api/payroll/register         # Get payroll register
GET    /api/payroll/summary          # Get payroll summary
PUT    /api/payroll/:id/approve      # Approve payroll batch
GET    /api/payroll/:id/export       # Export to Excel
POST   /api/payroll/:id/email        # Email salary slips
```

#### Offer Letters

```http
POST   /api/offer-letters            # Create offer letter
GET    /api/offer-letters/:id        # Get offer letter
GET    /api/offer-letters/:id/download # Download PDF
PUT    /api/offer-letters/:id        # Update offer letter
DELETE /api/offer-letters/:id        # Delete offer letter
```

#### Tax Configuration

```http
GET    /api/tax-config/slabs         # Get tax slabs
POST   /api/tax-config/slabs         # Create tax slab
PUT    /api/tax-config/slabs/:id     # Update tax slab
DELETE /api/tax-config/slabs/:id     # Delete tax slab
GET    /api/tax-config/deductions    # Get allowed deductions
```

#### Reports

```http
GET    /api/reports/salary-register  # Salary register report
GET    /api/reports/payroll-summary  # Payroll summary
GET    /api/reports/tax-summary      # Tax deduction summary
GET    /api/reports/pf-summary        # PF summary report
GET    /api/reports/esi-summary       # ESI summary report
GET    /api/reports/analytics         # Compensation analytics
```

#### Company Management

```http
GET    /api/companies                # List companies
POST   /api/companies                # Create company
GET    /api/companies/:id            # Get company details
PUT    /api/companies/:id            # Update company
DELETE /api/companies/:id            # Delete company
```

### Sample Request

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portfolix.in",
    "password": "SecurePassword123!"
  }'

# Create Employee (with token)
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "designation": "Software Engineer",
    "department": "Engineering",
    "dateOfJoining": "2025-01-01",
    "salaryStructure": {
      "basic": 50000,
      "hra": 15000,
      "dearness": 4000,
      "otherAllowances": 6000
    }
  }'
```

### Response Format

All API responses follow a standard format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-12-02T09:23:00.000Z",
    "requestId": "abc123"
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-12-02T09:23:00.000Z",
    "requestId": "abc123"
  }
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🗄️ Database Schema

### Company Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  code: String (unique, required),
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  taxId: String,
  pan: String,
  tan: String,
  financialYear: {
    start: Date,
    end: Date
  },
  taxConfiguration: Reference to TaxConfiguration,
  isActive: Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Employee Model

```javascript
{
  _id: ObjectId,
  employeeId: String (unique, auto-generated),
  companyId: Reference to Company,
  personalInfo: {
    firstName: String (required),
    lastName: String,
    email: String (unique, required),
    phone: String,
    dateOfBirth: Date,
    gender: Enum ['male', 'female', 'other']
  },
  employment: {
    designation: String (required),
    department: String,
    dateOfJoining: Date (required),
    employmentType: Enum ['full-time', 'part-time', 'contract'],
    status: Enum ['active', 'inactive', 'on_leave', 'terminated']
  },
  salaryStructure: {
    basic: Number (required),
    hra: Number,
    dearness: Number,
    conveyance: Number,
    medicalAllowance: Number,
    otherAllowances: Number,
    effectiveFrom: Date
  },
  statutory: {
    pan: String,
    uan: String (UAN for PF),
    esiNumber: String,
    aadhaar: String (encrypted)
  },
  bankDetails: {
    accountNumber: String (encrypted),
    ifsc: String,
    bankName: String,
    branchName: String
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### SalarySlip Model

```javascript
{
  _id: ObjectId,
  employeeId: Reference to Employee,
  companyId: Reference to Company,
  period: {
    month: Number (1-12),
    year: Number,
    payDate: Date
  },
  earnings: {
    basic: Number,
    hra: Number,
    dearness: Number,
    conveyance: Number,
    medicalAllowance: Number,
    otherAllowances: Number,
    bonus: Number,
    overtime: Number,
    gross: Number (calculated)
  },
  deductions: {
    providentFund: Number,
    esi: Number,
    professionalTax: Number,
    incomeTax: Number,
    loanDeduction: Number,
    otherDeductions: Number,
    totalDeductions: Number (calculated)
  },
  attendance: {
    totalDays: Number,
    presentDays: Number,
    absentDays: Number,
    paidLeaves: Number,
    unpaidLeaves: Number
  },
  netPay: Number (calculated),
  status: Enum ['draft', 'generated', 'approved', 'paid'],
  pdfUrl: String,
  generatedBy: Reference to User,
  generatedAt: Timestamp,
  approvedBy: Reference to User,
  approvedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### PayrollRegister Model

```javascript
{
  _id: ObjectId,
  companyId: Reference to Company,
  period: {
    month: Number,
    year: Number
  },
  salarySlips: [Reference to SalarySlip],
  summary: {
    totalEmployees: Number,
    totalGross: Number,
    totalDeductions: Number,
    totalNetPay: Number,
    totalPF: Number,
    totalESI: Number,
    totalProfessionalTax: Number
  },
  status: Enum ['processing', 'completed', 'approved', 'paid'],
  processedBy: Reference to User,
  processedAt: Timestamp,
  approvedBy: Reference to User,
  approvedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Indexes

```javascript
// Employee Collection
db.employees.createIndex({ "employeeId": 1 }, { unique: true })
db.employees.createIndex({ "companyId": 1 })
db.employees.createIndex({ "personalInfo.email": 1 })
db.employees.createIndex({ "employment.status": 1 })

// SalarySlip Collection
db.salaryslips.createIndex({ "employeeId": 1, "period.month": 1, "period.year": 1 })
db.salaryslips.createIndex({ "companyId": 1, "period.month": 1, "period.year": 1 })
db.salaryslips.createIndex({ "status": 1 })

// PayrollRegister Collection
db.payrollregisters.createIndex({ "companyId": 1, "period.month": 1, "period.year": 1 }, { unique: true })
```

---

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens**: Access tokens (24h expiry) and refresh tokens (7d expiry)
- **Password Security**: bcrypt hashing with 10 rounds
- **Role-Based Access Control (RBAC)**: 
  - `SUPER_ADMIN`: Full system access
  - `ADMIN`: Company-wide access
  - `HR_MANAGER`: HR operations
  - `EMPLOYEE`: Self-service access
  - `VIEWER`: Read-only access

### Data Protection

- **Encryption at Rest**: Sensitive fields (Aadhaar, bank account) encrypted with AES-256
- **Encryption in Transit**: HTTPS/TLS in production
- **PII Protection**: Personal data handling compliant with data protection standards

### API Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation on all inputs
- **SQL/NoSQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CORS**: Configured for allowed origins only

### Security Headers

```javascript
helmet.contentSecurityPolicy()
helmet.dnsPrefetchControl()
helmet.frameguard()
helmet.hidePoweredBy()
helmet.hsts()
helmet.ieNoOpen()
helmet.noSniff()
helmet.xssFilter()
```

---

## ⚡ Performance

### Optimization Strategies

- **Database Indexing**: Strategic indexes on frequently queried fields
- **Redis Caching**: Cache frequently accessed data (tax slabs, company configs)
- **Pagination**: Cursor-based pagination for large datasets
- **Batch Processing**: Bulk operations for payroll processing
- **Query Optimization**: Mongoose populate optimization, field selection
- **Connection Pooling**: MongoDB connection pool (size: 10)

### Performance Benchmarks

| Operation | Response Time | Throughput |
|-----------|---------------|------------|
| Employee List | < 100ms | 1000 req/s |
| Salary Slip Generation | < 500ms | 200 req/s |
| Payroll Processing (100 employees) | < 10s | 10 batches/min |
| PDF Generation | < 2s | 50 req/s |

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- employee.test.js

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm test -- integration/
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── salaryCalcService.test.js
│   │   └── taxCalcService.test.js
│   ├── controllers/
│   │   └── employeeController.test.js
│   └── utils/
│       └── validators.test.js
├── integration/
│   ├── auth.test.js
│   ├── employee.test.js
│   ├── payroll.test.js
│   └── salarySlip.test.js
└── fixtures/
    ├── employees.json
    └── companies.json
```

### Coverage Requirements

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t portfolix-compass-backend .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://mongo:27017/portfolix \
  -e JWT_SECRET=your_secret \
  portfolix-compass-backend

# Using docker-compose
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB (MongoDB Atlas recommended)
- [ ] Set strong `JWT_SECRET` and `ENCRYPTION_KEY`
- [ ] Enable Redis caching
- [ ] Configure Sentry for error tracking
- [ ] Set up log rotation
- [ ] Configure CORS with production domains
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring (PM2, DataDog, New Relic)
- [ ] Configure CDN for static assets
- [ ] Set up database indexes
- [ ] Enable compression middleware

### Environment-Specific Commands

```bash
# Development
npm run dev

# Production (with PM2)
pm2 start ecosystem.config.js --env production

# Staging
npm run start:staging
```

---

## 📊 Monitoring & Logging

### Application Logging

Logs are structured using Winston:

```javascript
// Log levels
- error: 0
- warn: 1
- info: 2
- debug: 3
```

### Log Files

```
logs/
├── error.log      # Error level logs
├── combined.log   # All logs
└── access.log     # HTTP access logs
```

### Monitoring Endpoints

```http
GET /health          # Basic health check
GET /health/ready    # Readiness probe (DB connection)
GET /metrics         # Prometheus metrics (if enabled)
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write/update tests
5. Ensure all tests pass: `npm test`
6. Lint your code: `npm run lint`
7. Commit with conventional commits: `git commit -m "feat: add new feature"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Add or update tests
chore: Build process or tooling changes
```

### Code Style

- **ESLint**: Run `npm run lint` before committing
- **Prettier**: Code formatting enforced
- **Naming**: camelCase for variables, PascalCase for classes
- **Comments**: JSDoc for functions and classes

---

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - Complete API reference with examples
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and architecture
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute
- **[Changelog](./CHANGELOG.md)** - Version history and changes

---

## 🆘 Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/portfoliobuilders/portfolix-compass-backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/portfoliobuilders/portfolix-compass-backend/discussions)
- **Email**: tech@portfoliobuilders.in

### FAQ

**Q: How do I generate my first salary slip?**
A: See the [Quick Start Guide](./docs/QUICKSTART.md#generating-salary-slips)

**Q: Can I customize tax calculations?**
A: Yes, modify `src/config/taxConfig.js` or use the Tax Configuration API

**Q: Does it support multi-currency?**
A: Currently supports INR only. Multi-currency support planned for v2.0

---

## 📄 License

**Proprietary License** - © 2025 Portfolix Enterprise Private Limited

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 🙏 Acknowledgments

Built with ❤️ by the **Portfolio Builders Engineering Team**

- **CTO**: Fahad
- **Architecture**: Backend Team
- **Contributors**: [View all contributors](https://github.com/portfoliobuilders/portfolix-compass-backend/graphs/contributors)

### Technologies Used

Special thanks to the open-source community for these amazing tools:
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [And many more...](./package.json)

---

## 🗺️ Roadmap

### v1.1 (Q1 2026)
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] Automated tax form generation (Form 16)
- [ ] Integration with accounting software

### v2.0 (Q2 2026)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app backend support

### v2.5 (Q3 2026)
- [ ] AI-powered salary recommendations
- [ ] Blockchain-based payroll verification
- [ ] Multi-state tax compliance

---

<div align="center">

**[⬆ Back to Top](#-portfolix-compass-backend)**

Made with 💼 for the future of HR Tech

</div>
