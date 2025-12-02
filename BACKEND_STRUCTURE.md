# Portfolix Compass Backend - Architecture & Structure

## 🏗️ Project Overview

Portalix Compass Backend is a production-grade Node.js/Express API for managing salary, compensation, and payroll operations. It provides a multi-tenant architecture with comprehensive features for salary slip generation, tax calculations, payroll management, and offer letter generation.

## 📁 Project Structure

```
portflix-compass-backend/
├── src/
│   ├── server.js                    # Main Express application entry
│   ├── config/
│   │   ├── database.js              # MongoDB connection configuration
│   │   ├── constants.js             # Application constants & enums
│   │   └── taxConfig.js             # Tax slab configurations (Kerala, etc.)
│   ├── models/
│   │   ├── Company.js               # Company/Organization model
│   │   ├── Employee.js              # Employee master data
│   │   ├── SalaryStructure.js        # Salary component definitions
│   │   ├── SalarySlip.js             # Generated salary slips
│   │   ├── PayrollRegister.js        # Payroll batch processing
│   │   ├── OfferLetter.js            # Job offer templates & instances
│   │   ├── TaxConfiguration.js       # Tax rules & slabs per company
│   │   ├── DeductionRule.js          # Standard & special deductions
│   │   └── User.js                   # User authentication
│   ├── routes/
│   │   ├── auth.routes.js            # Authentication endpoints
│   │   ├── employee.routes.js        # Employee CRUD operations
│   │   ├── salarySlip.routes.js      # Salary slip generation & retrieval
│   │   ├── payroll.routes.js         # Payroll processing & management
│   │   ├── offerLetter.routes.js     # Offer letter generation
│   │   ├── taxConfig.routes.js       # Tax configuration endpoints
│   │   ├── compensation.routes.js    # Compensation planning
│   │   ├── reports.routes.js         # Report generation
│   │   └── company.routes.js         # Company/organization endpoints
│   ├── controllers/
│   │   ├── authController.js         # Authentication logic
│   │   ├── employeeController.js     # Employee operations
│   │   ├── salarySlipController.js   # Salary slip generation logic
│   │   ├── payrollController.js      # Payroll calculations
│   │   ├── offerLetterController.js  # Offer letter generation
│   │   ├── taxController.js          # Tax calculation engine
│   │   ├── compensationController.js # Compensation analysis
│   │   ├── reportController.js       # Report generation
│   │   └── companyController.js      # Company management
│   ├── services/
│   │   ├── salaryCalcService.js      # Core salary calculation logic
│   │   ├── taxCalcService.js         # Tax calculation service
│   │   ├── pdfGeneratorService.js    # PDF generation for documents
│   │   ├── emailService.js           # Email notifications
│   │   ├── excelExportService.js     # Excel export functionality
│   │   ├── payrollService.js         # Payroll batch processing
│   │   └── validationService.js      # Business rule validation
│   ├── middlewares/
│   │   ├── auth.middleware.js        # JWT authentication
│   │   ├── errorHandler.js           # Global error handling
│   │   ├── validation.js             # Request validation (Joi)
│   │   ├── rateLimit.js              # Rate limiting
│   │   └── logger.js                 # Request logging
│   ├── utils/
│   │   ├── dateUtils.js              # Date calculations
│   │   ├── numberUtils.js            # Number formatting
│   │   ├── validators.js             # Custom validators
│   │   └── constants.js              # Helper constants
│   └── scripts/
│       ├── seedDatabase.js           # Initialize sample data
│       └── migrate.js                # Database migrations
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore patterns
├── package.json                       # Dependencies & scripts
├── BACKEND_STRUCTURE.md              # This file
└── API_DOCUMENTATION.md              # API endpoint specifications
```

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### Employee Management
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Salary Slips
- `POST /api/salary-slips/generate` - Generate salary slip
- `GET /api/salary-slips` - List salary slips
- `GET /api/salary-slips/:id` - Get salary slip
- `GET /api/salary-slips/:id/download` - Download as PDF

### Payroll
- `POST /api/payroll/process` - Process monthly payroll
- `GET /api/payroll/register` - Get payroll register
- `GET /api/payroll/summary` - Get payroll summary
- `PUT /api/payroll/:id/approve` - Approve payroll

### Offer Letters
- `POST /api/offer-letters` - Create offer letter
- `GET /api/offer-letters/:id` - Get offer letter
- `GET /api/offer-letters/:id/download` - Download offer letter

### Tax Configuration
- `GET /api/tax-config/slabs` - Get tax slabs
- `POST /api/tax-config/slabs` - Create tax slab
- `GET /api/tax-config/deductions` - Get allowed deductions

### Reports
- `GET /api/reports/salary-register` - Salary register report
- `GET /api/reports/payroll-summary` - Payroll summary
- `GET /api/reports/tax-summary` - Tax deduction summary

## 💾 Database Models

### Company
```
{
  _id: ObjectId,
  name: String (required),
  code: String (unique),
  address: String,
  taxId: String,
  financialYear: { start, end },
  taxConfiguration: Reference to TaxConfiguration,
  createdAt, updatedAt: Timestamp
}
```

### Employee
```
{
  _id: ObjectId,
  employeeId: String (unique),
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  department: String,
  designation: String,
  dateOfJoining: Date,
  salaryStructure: Reference,
  companyId: Reference,
  pan: String,
  uan: String,
  bankAccount: { accountNumber, ifsc, bankName },
  status: Enum (active, inactive, on_leave),
  createdAt, updatedAt: Timestamp
}
```

### SalarySlip
```
{
  _id: ObjectId,
  employeeId: Reference,
  month: Number,
  year: Number,
  earnings: { basic, hra, dearness, bonus, ... },
  deductions: { pf, tax, professional_tax, esic, ... },
  netPay: Number,
  status: Enum (draft, generated, approved),
  generatedAt: Timestamp
}
```

## 🔐 Security Features

1. **Authentication**: JWT-based authentication with refresh tokens
2. **Authorization**: Role-based access control (Admin, HR, Employee, Viewer)
3. **Encryption**: Sensitive data encryption at rest
4. **Rate Limiting**: API rate limiting to prevent abuse
5. **Input Validation**: Comprehensive input validation with Joi
6. **CORS**: Configured for frontend integration
7. **Helmet**: Security headers configuration

## 📊 Tax Calculation Engine

### Kerala Professional Tax Slabs
- 0 - 10,000: 0%
- 10,001 - 20,000: 1%
- 20,001+: 2% (capped at 2,500/month)

### Salary Calculations
- Gross Salary = Sum of all earnings components
- Basic + HRA + Dearness + Other allowances
- PF Deduction: 12% (Employee)
- Tax: Based on applicable tax slabs
- ESI: 0.75% (if applicable)
- Professional Tax: As per state configuration
- Net Pay = Gross - Total Deductions

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Start Development
```bash
npm run dev
```

### Production Start
```bash
npm start
```

## 📝 Development Workflow

1. Create feature branch from main
2. Implement feature with tests
3. Ensure all tests pass: `npm test`
4. Lint code: `npm run lint`
5. Submit PR with description
6. Code review before merge

## 🔗 Frontend Integration

The frontend should connect to:
- API Base URL: `http://localhost:5000/api`
- WebSocket (optional): `ws://localhost:5000`
- Authentication: Include `Authorization: Bearer {token}` header

## 📚 Additional Documentation

- API Documentation: See `API_DOCUMENTATION.md`
- Database Schema: See database models above
- Tax Configuration: See `src/config/taxConfig.js`
- Environment Variables: See `.env.example`

## 👨‍💻 CTO Notes

As your CTO, I've architected this backend with:
- **Scalability**: Microservices-ready with separation of concerns
- **Maintainability**: Clear folder structure and naming conventions
- **Testing**: Unit and integration test frameworks in place
- **Performance**: Optimized queries, indexing, and caching
- **Documentation**: Comprehensive inline comments and external docs
- **DevOps**: Docker & CI/CD ready with scripts

---

**Repository**: https://github.com/portfoliobuilders/portfolix-compass-backend
**Version**: 1.0.0
**Last Updated**: December 2025
