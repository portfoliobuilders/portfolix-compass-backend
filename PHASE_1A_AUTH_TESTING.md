# Phase 1A: Authentication Testing Guide

## Overview

Phase 1A implements the complete authentication system for Portfolix Compass, enabling:
- User login with email/password
- JWT-based token management (24h access, 7d refresh)
- Multi-company switching for Portfolio Builders, portfolix.tech, and portfolix.media
- Secure session management

## Endpoints Implemented

### 1. POST /auth/login
**Purpose:** Authenticate user and generate tokens

**Request:**
```json
{
  "email": "user@portfoliobuilders.com",
  "password": "securePassword123",
  "companyId": "optional-company-id"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@portfoliobuilders.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "COMPANY_ADMIN"
    },
    "company": {
      "id": "company-uuid",
      "name": "Portfolio Builders",
      "legalName": "Portfolio Builders Pvt Ltd"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "accessTokenExpiry": "2025-01-16T10:30:00Z",
      "refreshTokenExpiry": "2025-01-23T10:30:00Z"
    }
  },
  "message": "Login successful",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400: Missing email/password
- 401: Invalid credentials
- 404: User not found

**cURL Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@portfoliobuilders.com",
    "password": "securePassword123"
  }'
```

---

### 2. POST /auth/refresh
**Purpose:** Refresh access token using refresh token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "accessTokenExpiry": "2025-01-16T10:30:00Z"
  },
  "message": "Token refreshed successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400: Missing refresh token
- 401: Invalid or expired refresh token

**cURL Example:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

---

### 3. POST /auth/switch-company
**Purpose:** Switch active company (CRITICAL for multi-brand management)

**Authentication:** Bearer token required

**Request:**
```json
{
  "companyId": "portfolix-tech-company-id"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "portfolix-tech-company-id",
      "name": "Portfolix Tech",
      "legalName": "Portfolix Technology Pvt Ltd"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "accessTokenExpiry": "2025-01-16T10:30:00Z",
      "refreshTokenExpiry": "2025-01-23T10:30:00Z"
    }
  },
  "message": "Company switched successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400: Missing companyId
- 401: Unauthorized (no token)
- 403: User does not have access to this company
- 404: Company not found

**cURL Example:**
```bash
curl -X POST http://localhost:3000/auth/switch-company \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "portfolix-tech-company-id"
  }'
```

---

### 4. POST /auth/logout
**Purpose:** Logout user (client-side token removal)

**Authentication:** Bearer token required

**Request:** No body required

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {},
  "message": "Logout successful",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Testing Prerequisites

### 1. Database Setup
Ensure test data exists:
```sql
-- Create test companies (if not present)
INSERT INTO companies (id, name, legalName, createdAt) VALUES
  ('pb-uuid', 'Portfolio Builders', 'Portfolio Builders Pvt Ltd', NOW()),
  ('pt-uuid', 'Portfolix Tech', 'Portfolix Technology Pvt Ltd', NOW()),
  ('pm-uuid', 'Portfolix Media', 'Portfolix Media Pvt Ltd', NOW());

-- Create test user with access to all companies
INSERT INTO users (id, email, password, firstName, lastName, createdAt) VALUES
  ('user-uuid', 'user@portfoliobuilders.com', '<bcrypt-hash>', 'John', 'Doe', NOW());

-- Grant company access
INSERT INTO userCompanies (userId, companyId, role, createdAt) VALUES
  ('user-uuid', 'pb-uuid', 'COMPANY_ADMIN', NOW()),
  ('user-uuid', 'pt-uuid', 'COMPANY_ADMIN', NOW()),
  ('user-uuid', 'pm-uuid', 'COMPANY_ADMIN', NOW());
```

### 2. Environment Variables
```
JWT_ACCESS_SECRET=your-secret-key-min-32-chars-secure
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
```

---

## Testing Scenarios

### Scenario 1: Basic Login Flow
1. POST to /auth/login with valid credentials
2. Verify response contains user, company, and tokens
3. Verify accessToken expires in 24 hours
4. Verify refreshToken expires in 7 days

### Scenario 2: Token Refresh
1. Obtain tokens from login
2. Wait or manually set accessToken expiry to past time
3. POST to /auth/refresh with refreshToken
4. Verify new accessToken is generated
5. Verify old accessToken is invalidated

### Scenario 3: Multi-Company Switching (Critical)
1. Login to Portfolio Builders (default)
2. Verify company in response is Portfolio Builders
3. POST to /auth/switch-company with portfolix.tech companyId
4. Verify new tokens have portfolix.tech companyId in JWT payload
5. All subsequent requests filter data by new companyId
6. Switch back to Portfolio Builders
7. Verify salary slip data is scoped to Portfolio Builders only

### Scenario 4: Error Handling
1. POST with invalid email → 401 Unauthorized
2. POST with wrong password → 401 Unauthorized
3. POST to switch-company without Bearer token → 401 Unauthorized
4. POST to switch-company with companyId user doesn't access → 403 Forbidden
5. POST with expired refreshToken → 401 Unauthorized

---

## Frontend Integration Points

### 1. Login Page
- Collect email and password
- POST to /auth/login
- Store accessToken in memory (or secure httpOnly cookie)
- Store refreshToken in secure httpOnly cookie (recommended)
- Redirect to dashboard

### 2. Company Switcher
- Fetch user's companies from JWT or separate endpoint
- Display company list in dropdown/modal
- POST to /auth/switch-company when user selects
- Update Authorization header with new accessToken
- Refresh page data for selected company

### 3. Token Refresh Logic
- Intercept API responses
- If 401 Unauthorized:
  1. POST to /auth/refresh with refreshToken
  2. Update Authorization header with new accessToken
  3. Retry original request
  4. If refresh fails, redirect to login

### 4. Authorization Header
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Integration with Phase 1B & 2A

Once auth is working, the following endpoints become accessible:

### Phase 1B (Employees)
- GET /employees - Filtered by company from JWT
- POST /employees - Create employee in active company
- GET /employees/:id - Retrieve employee (company-scoped)
- PATCH /employees/:id - Update employee (company-scoped)
- DELETE /employees/:id - Soft delete employee

### Phase 2A (Payroll Records)
- GET /payroll - List all payroll records for active company
- POST /payroll/calculate - Calculate payroll for employees
- GET /payroll/:id - Retrieve single payroll record
- PATCH /payroll/:id/approve - Approve payroll (DRAFT → APPROVED)
- PATCH /payroll/:id/process - Process approved payroll
- PATCH /payroll/:id/archive - Archive paid payroll

---

## Security Checklist

- [x] Passwords hashed with bcrypt (min 10 rounds)
- [x] JWT tokens contain companyId for data isolation
- [x] Access token: 24 hours expiry
- [x] Refresh token: 7 days expiry
- [x] All protected endpoints verify Bearer token
- [x] Multi-tenant filtering on all database queries
- [x] Error messages don't expose sensitive info
- [x] No tokens logged in debug output
- [x] HTTPS only in production
- [x] Refresh token invalidation on logout (client-side)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Invalid token | Verify JWT_ACCESS_SECRET matches token generation |
| Token expiry mismatch | Check JWT_ACCESS_EXPIRY and JWT_REFRESH_EXPIRY env vars |
| Multi-company data leak | Verify companyId filter in all database queries |
| CORS errors | Add credentials: 'include' to fetch requests |
| Refresh token fails | Ensure refreshToken stored correctly, not rotated |

---

## What's Next

Phase 1A (Auth) is complete. Ready to proceed to:

1. **Phase 1B: Employee Management** - CRUD operations with multi-company filtering
2. **Phase 2A: Payroll Records** - Salary calculation and payroll workflow

Frontend team can now:
- Build login form against documented API
- Implement token storage and refresh logic
- Build company switcher UI
- Prepare employee and payroll interfaces
