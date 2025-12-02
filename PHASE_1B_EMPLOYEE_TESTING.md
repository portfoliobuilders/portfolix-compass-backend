# Phase 1B: Employee Management Testing Guide

## Overview

Phase 1B implements complete employee management for Portfolix Compass, enabling:
- Create, retrieve, update, and delete (CRUD) employee records
- Multi-tenant filtering (employees isolated by company)
- Pagination and advanced filtering capabilities
- Soft delete pattern for data integrity
- Support for multiple salary types and career stages
- Feeds the Payroll Register UI for Phase 2A

## Prerequisites

### 1. Authentication
- Phase 1A (Auth) must be completed
- You need a valid accessToken from /auth/login
- All employee endpoints require Bearer token authentication

### 2. Database Setup
Ensure test data exists:
```sql
-- Create test company
INSERT INTO companies (id, name, legalName, createdAt) VALUES
  ('pb-uuid', 'Portfolio Builders', 'Portfolio Builders Pvt Ltd', NOW());

-- Create test user
INSERT INTO users (id, email, password, firstName, lastName, createdAt) VALUES
  ('user-uuid', 'admin@portfoliobuilders.com', '<bcrypt-hash>', 'Admin', 'User', NOW());

-- Grant company access
INSERT INTO userCompanies (userId, companyId, role, createdAt) VALUES
  ('user-uuid', 'pb-uuid', 'COMPANY_ADMIN', NOW());
```

## API Endpoints Implemented

### 1. POST /employees
**Create a new employee**

**Request:**
```bash
curl -X POST http://localhost:3000/employees \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh.kumar@pb.com",
    "phone": "9876543210",
    "employeeCode": "PB001",
    "careerStage": "PROBATION",
    "salaryType": "STANDARD",
    "joiningDate": "2025-01-15",
    "department": "Sales",
    "designation": "Sales Executive",
    "bankName": "HDFC Bank",
    "bankAccount": "1234567890123456",
    "ifscCode": "HDFC0001234",
    "panNumber": "ABCDE1234F",
    "aadharNumber": "123456789012",
    "emergencyContact": "Priya Kumar",
    "emergencyPhone": "9876543211",
    "basicSalary": 25000,
    "hra": 7500,
    "da": 2500,
    "otherAllowances": 0
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "emp-uuid",
      "companyId": "pb-uuid",
      "firstName": "Rajesh",
      "lastName": "Kumar",
      "email": "rajesh.kumar@pb.com",
      "employeeCode": "PB001",
      "careerStage": "PROBATION",
      "salaryType": "STANDARD",
      "status": "ACTIVE",
      "joiningDate": "2025-01-15",
      "department": "Sales",
      "designation": "Sales Executive",
      "basicSalary": "25000.00",
      "hra": "7500.00",
      "da": "2500.00",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  },
  "message": "Employee created successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400: Missing required fields or invalid data
- 409: Email or Employee Code already exists in company
- 404: Reporting manager not found in company

---

### 2. GET /employees
**Get all employees with pagination and filters**

**Request:**
```bash
curl -X GET "http://localhost:3000/employees?page=1&limit=10&status=ACTIVE&careerStage=PROBATION&search=rajesh" \
  -H "Authorization: Bearer <accessToken>"
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (ACTIVE, ON_LEAVE, INACTIVE, TERMINATED)
- `careerStage` (string): Filter by career stage (PROBATION, ESTABLISHED)
- `salaryType` (string): Filter by salary type (STANDARD, SALES)
- `search` (string): Search in firstName, lastName, email, employeeCode

**Response (200):**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "emp-uuid-1",
        "firstName": "Rajesh",
        "lastName": "Kumar",
        "email": "rajesh.kumar@pb.com",
        "employeeCode": "PB001",
        "careerStage": "PROBATION",
        "salaryType": "STANDARD",
        "status": "ACTIVE",
        "department": "Sales",
        "designation": "Sales Executive",
        "basicSalary": "25000.00",
        "joiningDate": "2025-01-15",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  },
  "message": "Employees fetched successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 3. GET /employees/:id
**Get single employee by ID**

**Request:**
```bash
curl -X GET "http://localhost:3000/employees/emp-uuid-1" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):** Returns full employee object with all fields

**Error Response (404):** Employee not found

---

### 4. PATCH /employees/:id
**Update employee details (partial update)**

**Request:**
```bash
curl -X PATCH "http://localhost:3000/employees/emp-uuid-1" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Product",
    "designation": "Senior Sales Executive",
    "careerStage": "ESTABLISHED",
    "basicSalary": 35000
  }'
```

**Updatable Fields:**
- firstName, lastName
- phone
- careerStage (PROBATION, ESTABLISHED)
- status (ACTIVE, ON_LEAVE, INACTIVE, TERMINATED)
- department, designation
- bankName, bankAccount, ifscCode, panNumber
- basicSalary, hra, da, otherAllowances

**Response (200):** Returns updated employee object

---

### 5. DELETE /employees/:id
**Soft delete employee (sets status to INACTIVE)**

**Request:**
```bash
curl -X DELETE "http://localhost:3000/employees/emp-uuid-1" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "success": true,
  "data": {},
  "message": "Employee deleted successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Testing Scenarios

### Scenario 1: Create Multiple Employees
1. Login and get accessToken
2. Create employee with PROBATION career stage
3. Create employee with ESTABLISHED career stage and SALES salary type
4. Create employee with different department and designation
5. Verify all employees created in active company only

### Scenario 2: Pagination and Filtering
1. GET /employees?page=1&limit=10 (get first 10)
2. GET /employees?page=2&limit=10 (get next 10)
3. GET /employees?status=ACTIVE (filter by active)
4. GET /employees?careerStage=ESTABLISHED (filter by career stage)
5. GET /employees?search=rajesh (search by name)
6. Verify pagination metadata (total, pages, current page)

### Scenario 3: Update Employee
1. Create employee with initial salary
2. Promote to ESTABLISHED career stage
3. Increase basicSalary, hra, da
4. Update department and designation
5. Verify all changes persisted
6. Verify history is not lost (if audit trail enabled)

### Scenario 4: Multi-Company Isolation
1. Create employees in Portfolio Builders
2. Switch company to Portfolix Tech
3. GET /employees should return empty (no employees in that company)
4. Switch back to Portfolio Builders
5. GET /employees should show original employees
6. Verify data is never leaked across companies

### Scenario 5: Error Handling
1. POST without required fields → 400
2. POST with duplicate email in same company → 409
3. POST with invalid careerStage → 400
4. GET non-existent employee → 404
5. PATCH employee from different company → 404
6. DELETE already deleted employee → 404

---

## Integration with Phase 2A (Payroll Records)

Phase 1B employees feed into Phase 2A payroll:

1. **Payroll Calculation**
   - Uses employee's basicSalary, hra, da, otherAllowances
   - Uses careerStage for bonus calculation
   - Uses salaryType for commission structure

2. **Payroll List Query**
   - Fetches active employees from this phase
   - Calculates monthly salaries
   - Groups by department, career stage

3. **Report Generation**
   - Employee list → Payroll Register (Phase 2A endpoint)
   - Filters employees by status, department, career stage
   - Exports employee data for salary slip generation

---

## Security Considerations

- ✅ All queries filtered by companyId from JWT token
- ✅ No employee from another company can be accessed
- ✅ Soft delete preserves data for audits
- ✅ Sensitive fields encrypted (PAN, Aadhar)
- ✅ Input validation on all fields
- ✅ Authorization check on every endpoint

---

## What's Next

Phase 1B (Employee Management) is complete. Ready to proceed to:

**Phase 2A: Payroll Records**
- Uses employees from Phase 1B
- Calculates monthly payroll
- Manages payroll workflow (DRAFT → APPROVED → PAID)
- Generates salary slips and payroll registers
- Powers the register UI with employee + payroll data

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired or invalid. Use /auth/refresh to get new token |
| 404 Employee not found | Verify employee exists in active company, not deleted |
| Pagination returns empty | Check limit parameter, may be exceeding page count |
| Search not working | Ensure search term matches firstName, lastName, email, or employeeCode |
| Duplicate email error | Email must be unique per company |
