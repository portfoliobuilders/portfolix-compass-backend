# 🔧 FIX IMPLEMENTATION GUIDE
## PHASE 4 - Production Hardening: Critical Bug Fixes
**Date:** December 4, 2025  
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours

---

## 📋 QUICK REFERENCE

**Total Fixes Required:** 8 Phase 1 + 4 Phase 2 = 12 total  
**Files to Modify:** 5 test files + 2 config files  
**Complexity:** Medium (code changes + environment setup)  
**Risk Level:** LOW (isolated to tests, no production code changes)

---

## 🚀 PHASE 1 FIXES (CRITICAL - Must do first)

### ✅ FIX 1: Create .env.test File
**Why:** Tests need MongoDB test database connection  
**File:** `.env.test` (root directory)  
**Action:** Create new file with:

```bash
# .env.test
MONGODB_TEST_URI=mongodb://localhost:27017/portfolix-test
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
```

**Verification:**
```bash
# Check file exists
test -f .env.test && echo "✅ .env.test created"
```

---

### ✅ FIX 2: Add jest.config.js
**Why:** Configure Jest timeout and test environment  
**File:** `jest.config.js` (root directory)  
**Content:**

```javascript
module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  testMatch: ['**/*.test.js', '**/*.integration.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  }
};
```

---

### ✅ FIX 3: Fix Attendance Test - Add Token Initialization
**File:** `test/integration/attendance.integration.test.js`  
**Lines to Change:** beforeAll() section  
**Current Code:**
```javascript
let companyId, employeeId, token;  // ❌ token never initialized

beforeAll(async () => {
  const company = await Company.create({...});
  // ... setup code ...
});
```

**Fixed Code:**
```javascript
let companyId, employeeId, token;
let app;  // Add app reference
let server;  // Add server reference

beforeAll(async () => {
  // CRITICAL: Connect to MongoDB test database FIRST
  await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/portfolix-test');
  
  // CRITICAL: Import app AFTER connection
  app = require('../../../src/server');
  
  // Setup test company
  const company = await Company.create({
    name: 'Test Company',
    industry: 'IT',
    size: 'MEDIUM',
    registrationNumber: 'TC123456'
  });
  companyId = company._id;

  // Setup test employee
  const employee = await Employee.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    companyId,
    department: 'Engineering',
    role: 'Developer'
  });
  employeeId = employee._id;
  
  // CRITICAL: Generate test JWT token
  // Option A: Create test user and login
  const testUser = await User.create({
    email: 'testuser@test.com',
    password: await require('bcryptjs').hash('TestPassword123', 10),
    companyId,
    role: 'admin'
  });
  
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testuser@test.com',
      password: 'TestPassword123'
    });
  
  token = loginRes.body.data.accessToken;
  
  if (!token) {
    throw new Error('❌ Failed to generate test token');
  }
});

afterEach(async () => {
  // Cleanup after each test to prevent data pollution
  await Attendance.deleteMany({ companyId });
});

afterAll(async () => {
  // Full cleanup
  await Attendance.deleteMany({});
  await Employee.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
  if (server) server.close();
});
```

**Verification:**
```bash
# Run single test file
npm test -- test/integration/attendance.integration.test.js
```

---

### ✅ FIX 4: Fix Task Test - Add Token Initialization
**File:** `test/integration/task.integration.test.js`  
**Changes:** IDENTICAL to FIX 3 (Attendance test fix)  

Replace entire beforeAll/afterAll section with same pattern as attendance test.

---

### ✅ FIX 5: Fix Leave Test - Add Token Initialization
**File:** `test/integration/leave.integration.test.js`  
**Changes:** IDENTICAL to FIX 3  

Replace entire beforeAll/afterAll section with same pattern as attendance test.

---

### ✅ FIX 6: Verify Model Imports Exist
**Why:** Tests import models that may not exist  
**Action:** Check each model file exists

```bash
# Verify all required model files
ls -la src/models/Attendance.js  # Should exist
ls -la src/models/Task.js         # Should exist  
ls -la src/models/Leave.js        # Should exist
ls -la src/models/Employee.js     # Should exist
ls -la src/models/Company.js      # Should exist
ls -la src/models/User.js         # Should exist
```

**If Missing:**
- Create the missing model files in `src/models/`
- Follow existing pattern from other models
- Use MongoDB schema for Attendance, Task, Leave
- Export with `module.exports = mongoose.model('ModelName', schema);`

---

### ✅ FIX 7: Verify Server Location
**Why:** Tests import server but path may be wrong  
**Action:** Check where server.js is located

```bash
# Find server file
find . -name 'server.js' -type f

# Should be one of:
# ./src/server.js  (most common)
# ./server.js      (root)
# ./index.js       (alternative)
```

**If Path Wrong:**
- Update ALL test files with correct path
- Change `require('../../../src/server')` to correct path

---

### ✅ FIX 8: Add Missing Dependencies
**Why:** Tests may need bcryptjs for password hashing  
**Action:**

```bash
# Install if missing
npm install --save-dev supertest jest bcryptjs

# Verify installation
npm list supertest jest bcryptjs
```

---

## ⏭️ PHASE 2 FIXES (IMPORTANT - Before CI/CD)

### FIX 9: Add afterEach Cleanup
**Pattern:** Already included in FIX 3 template above  
**Goal:** Prevent test data pollution between tests

### FIX 10: Fix Hard-coded Dates
**File:** `test/integration/leave.integration.test.js`  
**Change:**
```javascript
// ❌ BEFORE (flaky)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// ✅ AFTER (fixed)
const today = new Date('2025-12-04');
const tomorrow = new Date('2025-12-05');
const nextWeek = new Date('2025-12-11');
```

### FIX 11: Complete Error Assertions
**Pattern:**
```javascript
// ❌ BEFORE (incomplete)
expect(res.body.success).toBe(false);

// ✅ AFTER (complete)
expect(res.body.success).toBe(false);
expect(res.body.message).toBeDefined();
expect(res.body.message.length).toBeGreaterThan(0);
```

### FIX 12: Add Response Structure Validation
**Pattern:**
```javascript
// Add to successful response tests
expect(res.body).toHaveProperty('success');
expect(res.body).toHaveProperty('data');
expect(res.body).toHaveProperty('message');
expect(typeof res.body.success).toBe('boolean');
expect(res.body.data).toBeInstanceOf(Object);
```

---

## ✅ VERIFICATION CHECKLIST

Before marking fixes complete, verify:

- [ ] `.env.test` file created with MONGODB_TEST_URI
- [ ] `jest.config.js` added with 10000ms timeout
- [ ] Attendance test has token initialization in beforeAll()
- [ ] Task test has token initialization in beforeAll()
- [ ] Leave test has token initialization in beforeAll()
- [ ] All model files exist in src/models/
- [ ] Server path is correct (src/server.js or similar)
- [ ] Dependencies installed (npm list supertest)
- [ ] afterEach cleanup added to all test files
- [ ] No hard-coded dynamic dates
- [ ] Error assertions check message content
- [ ] Response structure validated

---

## 🚀 EXECUTION STEPS

### Step 1: Setup (5 minutes)
```bash
# 1. Create .env.test
echo 'MONGODB_TEST_URI=mongodb://localhost:27017/portfolix-test' > .env.test

# 2. Create jest.config.js with config above

# 3. Install dependencies
npm install --save-dev supertest jest bcryptjs
```

### Step 2: Fix Tests (45 minutes)
```bash
# 1. Fix attendance test (copy template)
vim test/integration/attendance.integration.test.js

# 2. Fix task test (copy template)
vim test/integration/task.integration.test.js

# 3. Fix leave test (copy template)
vim test/integration/leave.integration.test.js
```

### Step 3: Verify Models (10 minutes)
```bash
# Check all models exist
ls -la src/models/Attendance.js src/models/Task.js src/models/Leave.js
```

### Step 4: Run Tests (20 minutes)
```bash
# Start MongoDB (if not running)
mongod

# In another terminal, run tests
npm test

# Or run individual test file
npm test -- test/integration/attendance.integration.test.js
```

### Step 5: Debug (30 minutes)
```bash
# If tests fail:
# 1. Check error message
# 2. Verify environment variables
# 3. Check MongoDB is running
# 4. Verify model paths
# 5. Check token generation
```

---

## 📊 SUCCESS CRITERIA

✅ All tests pass with `npm test`  
✅ No timeout errors  
✅ All assertions pass  
✅ Coverage report generated  
✅ No database cleanup issues  
✅ Tests can run multiple times without issues  

---

## 🎯 EXPECTED RESULTS AFTER FIXES

**Before Fixes:**
- Tests: ❌ Won't execute (token undefined)
- Coverage: 0%
- Status: NOT READY

**After Phase 1 Fixes:**
- Tests: ✅ Execute successfully  
- Coverage: 15-20%
- Status: BASIC READINESS

**After Phase 2 Fixes:**
- Tests: ✅ Pass consistently
- Coverage: 20-25%
- Status: CI/CD READY

---

**Implementation Date:** December 4, 2025  
**Last Updated:** 9:00 AM IST  
**Status:** READY FOR EXECUTION
