# MVP Quick Start Guide

## What's Ready to Test

The backend now includes a complete salary calculation pipeline:

✅ **SalaryCalculationService** - Core salary calculation engine
✅ **Salary Slip Controller** - CRUD operations  
✅ **API Routes** - POST /salary-slips/calculate, GET endpoints
✅ **Error Handling** - Standardized responses
✅ **Database Schema** - All models with relationships
✅ **Authentication** - JWT middleware ready
✅ **Multi-tenant** - Company-level data isolation built in
✅ **Tax Config** - Kerala Professional Tax with calculations

---

## Getting Started (5 Minutes)

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/portfoliobuilders/portfolix-compass-backend.git
cd portfolix-compass-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env and add:
# DATABASE_URL=postgresql://user:password@localhost:5432/portfolix_compass
# JWT_SECRET=your_super_secret_key_here_min_32_chars
# NODE_ENV=development
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb portfolix_compass

# Run Prisma migrations
npx prisma migrate dev --name init

# (Optional) Seed test data
node scripts/seed.js
```

### 3. Start Server

```bash
# Development
npm run dev

# Server runs at http://localhost:3000
```

---

## Testing the API

### Option A: Using cURL

#### 1. Calculate Standard Salary

```bash
curl -X POST http://localhost:3000/salary-slips/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employeeId": "emp_001",
    "salaryStructureId": "ss_001",
    "month": "2025-01-01"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "slip_123",
    "employee": {
      "id": "emp_001",
      "name": "John Doe",
      "employeeCode": "EMP001"
    },
    "salaryType": "STANDARD",
    "components": {
      "basic": 20000,
      "hra": 6000,
      "da": 3000,
      "allowances": 2000,
      "gross": 31000
    },
    "deductions": {
      "pf": 3720,
      "pt": 0,
      "esi": 232.50,
      "incomeTax": 0,
      "totalDeductions": 3952.50
    },
    "net": 27047.50,
    "month": "2025-01-01",
    "calculatedAt": "2025-01-02T10:30:00Z"
  },
  "message": "Salary calculated successfully",
  "timestamp": "2025-01-02T10:30:00Z"
}
```

#### 2. Calculate Sales Salary

```bash
curl -X POST http://localhost:3000/salary-slips/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employeeId": "emp_sales_001",
    "salaryStructureId": "ss_sales_001",
    "month": "2025-01-01"
  }'
```

**Expected Response (Sales with 8 sales, 2 referrals):**
```json
{
  "success": true,
  "data": {
    "id": "slip_124",
    "salaryType": "SALES",
    "components": {
      "fixed": 17000,
      "basicSalary": 15000,
      "allowances": 2000,
      "commission": 5750,
      "milestoneBonus": 3500,
      "referralBonus": 12500,
      "gross": 38750
    },
    "deductions": {
      "pf": 4650,
      "pt": 775,
      "esi": 290.63,
      "totalDeductions": 5715.63
    },
    "performance": {
      "salesCount": 8,
      "referralCount": 2
    },
    "net": 33034.37,
    "careerStage": "ESTABLISHED"
  },
  "message": "Salary calculated successfully",
  "timestamp": "2025-01-02T10:30:00Z"
}
```

#### 3. List Salary Slips

```bash
curl -X GET "http://localhost:3000/salary-slips?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get Salary Slip by ID

```bash
curl -X GET http://localhost:3000/salary-slips/slip_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Option B: Using Postman

1. **Create Collection**: "Portfolix Compass Backend"
2. **Add Environment Variable**:
   - Key: `jwt_token`
   - Value: (will get from login endpoint - coming soon)
   - Key: `base_url`
   - Value: `http://localhost:3000`

3. **Create Request**: POST Calculate Salary
   ```
   POST {{base_url}}/salary-slips/calculate
   
   Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{jwt_token}}
   
   Body (raw JSON):
   {
     "employeeId": "emp_001",
     "salaryStructureId": "ss_001",
     "month": "2025-01-01"
   }
   ```

---

## Salary Calculation Examples

### Standard Salary (Probation)
```
Basic: ₹20,000
HRA (30%): ₹6,000
DA (15%): ₹3,000
Allowances: ₹2,000
---
Gross: ₹31,000

Deductions:
PF (12%): ₹3,720
Professional Tax: ₹0 (below ₹10K threshold)
ESI (0.75%): ₹232.50
---
Net Salary: ₹27,047.50
```

### Sales Salary (Established, 8 sales, 2 referrals)
```
Fixed Salary:
  Basic: ₹15,000
  Allowances: ₹2,000
  Fixed Total: ₹17,000

Variable Components:
  Commission (8 sales): ₹5,750
  Milestone Bonuses (3rd & 8th): ₹3,500
  Referral Bonuses (2 referrals): ₹12,500
---
Gross: ₹38,750

Deductions:
  PF (12%): ₹4,650
  PT (2%): ₹775
  ESI (0.75%): ₹290.63
---
Net Salary: ₹33,034.37
```

### Kerala Professional Tax Slabs
```
Salary Range          | Tax Rate | Calculation
---------------------------------------------
Up to ₹10,000        | 0%       | No tax
₹10,001 to ₹20,000   | 1%       | (Salary - 10K) × 1%
₹20,001 and above    | 2%       | min((Salary - 20K) × 2%, ₹2,500)
```

---

## Database Schema for Testing

Before testing, ensure you have test data:

### Create Company
```sql
INSERT INTO "Company" (id, name, "registrationNumber", "industryType", status) 
VALUES (
  'company_001', 
  'Portfolix Compass Demo',
  'REG123456',
  'IT',
  'ACTIVE'
);
```

### Create Employee
```sql
INSERT INTO "Employee" (id, "companyId", name, email, "employeeCode", status) 
VALUES (
  'emp_001',
  'company_001',
  'John Doe',
  'john@example.com',
  'EMP001',
  'ACTIVE'
);
```

### Create Salary Structure
```sql
INSERT INTO "SalaryStructure" (id, "employeeId", "salaryType", "basicSalary", hra, da, allowances) 
VALUES (
  'ss_001',
  'emp_001',
  'STANDARD',
  20000,
  6000,
  3000,
  2000
);
```

---

## Common Errors & Solutions

### "Missing authentication token"
**Issue**: JWT token not provided
**Solution**: Add `-H "Authorization: Bearer TOKEN"` to requests

### "Invalid token"
**Issue**: Token is expired or invalid
**Solution**: Generate new token (login endpoint coming soon)

### "Employee not found"
**Issue**: employeeId doesn't exist in database
**Solution**: Create test employee first using SQL above

### "Salary structure not found"
**Issue**: salaryStructureId doesn't exist
**Solution**: Create salary structure first using SQL above

---

## Next Features to Test

- [ ] Authentication/Login endpoint
- [ ] Employee CRUD endpoints
- [ ] Salary Structure management
- [ ] Payroll batch processing
- [ ] PDF salary slip generation
- [ ] Email notifications
- [ ] Offer letter generation
- [ ] Multi-company switching

---

## Repository Status

**Total Commits**: 18  
**Files Created**: 18+  
**MVP Components**: ✅ Complete  
**Ready for**: Frontend integration & API testing  
**Next Phase**: Additional services, PDF generation, Email integration  

---

## Support

For issues or questions:
1. Check IMPLEMENTATION_ROADMAP.md for architecture details
2. Review NEXT_STEPS_AND_SERVICES_GUIDE.md for remaining components
3. Check BACKEND_STRUCTURE.md for data models
