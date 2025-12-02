# Phase 2A: Payroll Records & Register Testing Guide

## Overview

Phase 2A implements payroll calculation and management for Portfolix Compass, enabling:
- Monthly payroll calculation using employee data from Phase 1B
- Payroll workflow management (DRAFT → CALCULATED → APPROVED → PROCESSED → PAID)
- Feeds the Payroll Register UI with employee + salary + deduction data
- Multi-tenant filtering for company-level payroll isolation
- Support for different salary types and career stages with bonus calculations

## What Powers the Register UI

The GET /payroll endpoint combines:
- **Employee Data** (Phase 1B): firstName, lastName, employeeCode, department, designation, careerStage
- **Salary Components**: basicSalary, hra, da, allowances
- **Calculated Earnings**: Total earnings based on salary type
- **Deductions**: PF, PT, ESI, IT
- **Net Salary**: Gross - Deductions
- **Status**: CALCULATED, APPROVED, PROCESSED, PAID

## Endpoints Implemented

### 1. POST /payroll/calculate
**Calculate monthly payroll for employees**

**Request:**
```bash
curl -X POST http://localhost:3000/payroll/calculate \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2025-01-01",
    "employeeIds": ["optional-emp-id-1", "optional-emp-id-2"]
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payrolls": [
      {
        "id": "payroll-uuid",
        "companyId": "pb-uuid",
        "employeeId": "emp-uuid",
        "month": "2025-01-01",
        "status": "CALCULATED",
        "basicSalary": "25000.00",
        "hra": "7500.00",
        "da": "2500.00",
        "allowances": "0.00",
        "earnings": "35000.00",
        "pfDeduction": "3000.00",
        "ptDeduction": "300.00",
        "esiDeduction": "0.00",
        "itDeduction": "0.00",
        "totalDeductions": "3300.00",
        "netSalary": "31700.00",
        "ctc": "35000.00"
      }
    ],
    "count": 1
  },
  "message": "Payroll calculated for 1 employee(s)",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400: Missing month or invalid data
- 404: No active employees found
- 409: Payroll already exists for this month

---

### 2. GET /payroll (Powers Payroll Register)
**Get payroll records with employee details - MAIN ENDPOINT FOR REGISTER UI**

**Request:**
```bash
curl -X GET "http://localhost:3000/payroll?page=1&limit=20&month=2025-01-01&status=APPROVED&department=Sales" \
  -H "Authorization: Bearer <accessToken>"
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `month` (date): Filter by month (ISO format, standardized to 1st)
- `status` (string): Filter by status (CALCULATED, APPROVED, PROCESSED, PAID)
- `department` (string): Filter employees by department

**Response (200) - Powers Register Display:**
```json
{
  "success": true,
  "data": {
    "payrolls": [
      {
        "id": "payroll-uuid",
        "companyId": "pb-uuid",
        "employeeId": "emp-uuid",
        "month": "2025-01-01",
        "status": "APPROVED",
        "basicSalary": "25000.00",
        "hra": "7500.00",
        "da": "2500.00",
        "allowances": "0.00",
        "earnings": "35000.00",
        "pfDeduction": "3000.00",
        "ptDeduction": "300.00",
        "esiDeduction": "0.00",
        "itDeduction": "0.00",
        "totalDeductions": "3300.00",
        "netSalary": "31700.00",
        "ctc": "35000.00",
        "employee": {
          "id": "emp-uuid",
          "firstName": "Rajesh",
          "lastName": "Kumar",
          "employeeCode": "PB001",
          "email": "rajesh.kumar@pb.com",
          "department": "Sales",
          "designation": "Sales Executive",
          "careerStage": "PROBATION"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  },
  "message": "Payroll records fetched successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 3. PATCH /payroll/:id/approve
**Approve payroll (CALCULATED → APPROVED)**

**Request:**
```bash
curl -X PATCH "http://localhost:3000/payroll/payroll-uuid/approve" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):** Returns updated payroll with status = APPROVED

---

### 4. PATCH /payroll/:id/process
**Process approved payroll (APPROVED → PROCESSED)**

**Request:**
```bash
curl -X PATCH "http://localhost:3000/payroll/payroll-uuid/process" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):** Returns updated payroll with status = PROCESSED

---

### 5. PATCH /payroll/:id/archive
**Archive/Mark as paid (PROCESSED → PAID)**

**Request:**
```bash
curl -X PATCH "http://localhost:3000/payroll/payroll-uuid/archive" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):** Returns updated payroll with status = PAID

---

## Payroll Register UI Integration

The Payroll Register UI uses GET /payroll endpoint to display:

| Column | Data Source | Format |
|--------|-------------|--------|
| Employee Code | employee.employeeCode | "PB001" |
| Name | employee.firstName + lastName | "Rajesh Kumar" |
| Department | employee.department | "Sales" |
| Designation | employee.designation | "Sales Executive" |
| Career Stage | employee.careerStage | "PROBATION" |
| Basic | basicSalary | "25,000" |
| HRA | hra | "7,500" |
| DA | da | "2,500" |
| Allowances | allowances | "0" |
| Gross Earnings | earnings | "35,000" |
| PF Deduction | pfDeduction | "3,000" |
| PT Deduction | ptDeduction | "300" |
| ESI Deduction | esiDeduction | "0" |
| IT Deduction | itDeduction | "0" |
| Total Deductions | totalDeductions | "3,300" |
| Net Salary | netSalary | "31,700" |
| CTC/Annual | ctc | "35,000" |
| Status | status | "APPROVED" |
| Actions | id | Edit, Approve, Process, Archive |

## Testing Scenarios

### Scenario 1: Calculate Monthly Payroll
1. Ensure Phase 1B employees exist and are ACTIVE
2. POST /payroll/calculate with month = current month
3. Verify payroll created for all active employees
4. Verify status = CALCULATED
5. Verify salary calculations:
   - Earnings = basicSalary + hra + da + allowances
   - PF = 12% of basicSalary (if applicable)
   - PT = Per Kerala slabs (0-10K: 0%, 10-20K: 1%, 20K+: 2% max ₹2,500)
   - ESI = 0.75% if salary ≤ ₹21,000
   - NetSalary = Earnings - (PF + PT + ESI + IT)

### Scenario 2: Payroll Register Display
1. Calculate payroll for multiple employees
2. GET /payroll?page=1&limit=10
3. Verify employee data joins correctly
4. Verify all salary components displayed
5. Verify pagination works (total = 42, pages = 5)
6. Test filtering by month, status, department

### Scenario 3: Payroll Workflow
1. Calculate payroll (status: CALCULATED)
2. PATCH /payroll/:id/approve (status → APPROVED)
3. Verify status updated and appears in register with "APPROVED" badge
4. PATCH /payroll/:id/process (status → PROCESSED)
5. Verify status transitions correctly
6. PATCH /payroll/:id/archive (status → PAID)
7. Verify final status = PAID and can be archived

### Scenario 4: Multi-Company Isolation
1. Calculate payroll in Portfolio Builders
2. Switch company to Portfolix Tech
3. GET /payroll should only show Portfolix Tech payroll
4. Create employees and calculate payroll in Portfolix Tech
5. Switch back to Portfolio Builders
6. Verify only Portfolio Builders payroll visible

### Scenario 5: Error Handling
1. POST calculate without month → 400
2. POST calculate with non-existent month → 400
3. POST calculate twice for same month → 409 (conflict)
4. PATCH approve on non-existent payroll → 404
5. PATCH approve non-CALCULATED payroll → 400
6. PATCH process non-APPROVED payroll → 400

---

## Salary Calculation Examples

### Example 1: Probation Standard Salary
```
Employee: Rajesh Kumar (PROBATION, STANDARD)
Basic: ₹25,000
HRA: ₹7,500
DA: ₹2,500
Allowances: ₹0

Earnings = 25,000 + 7,500 + 2,500 = ₹35,000
PF (12%) = ₹3,000
PT = ₹300 (10K-20K range: 1% of excess)
ESI (0.75%) = ₹262.50 (salary ≤ 21K? No, so may vary)
IT = ₹0 (assuming under tax bracket)

Total Deductions = ₹3,562.50
Net Salary = ₹35,000 - ₹3,562.50 = ₹31,437.50
```

### Example 2: Established Sales Salary with Commission
```
Employee: Priya Singh (ESTABLISHED, SALES)
Fixed: ₹40,000
Commission (Tier 1): ₹5,000
Bonus (Milestone): ₹2,000
Referral Bonus: ₹1,500

Earnings = 40,000 + 5,000 + 2,000 + 1,500 = ₹48,500
PF (12%) = ₹4,800
PT = ₹700 (20K+: 2%, capped at ₹2,500)
ESI = ₹0 (salary > 21K, not applicable)
IT = ₹500 (estimated)

Total Deductions = ₹6,000
Net Salary = ₹48,500 - ₹6,000 = ₹42,500
CTC/Annual = ₹48,500 * 12 = ₹582,000
```

---

## What's Next

Phase 2A (Payroll Records) is complete. The system now:
- ✅ Accepts employee data from Phase 1B
- ✅ Calculates monthly payroll with proper deductions
- ✅ Powers the Payroll Register UI display
- ✅ Manages payroll workflow (CALCULATED → APPROVED → PAID)
- ✅ Maintains multi-company data isolation

**Payroll Register UI can now:**
- Display employee list with calculated salaries
- Filter by month, department, status
- Show salary components and deductions
- Manage approval and processing workflow
- Export register data

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Calculation not matching expected | Verify employee data in Phase 1B (basicSalary, hra, da, careerStage, salaryType) |
| PT deduction too high | Check PT slab: 0-10K (0%), 10-20K (1%), 20K+ (2% max ₹2,500) |
| Duplicate payroll error | Ensure you're calculating for different month or deleted existing record |
| Register shows empty | Check filters - may be looking for wrong month, status, or company |
| Employee data not joining | Verify employee.id foreign key relationship with payroll.employeeId |
