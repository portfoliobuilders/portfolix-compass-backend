# Backend Automated Testing Guide

## Overview

This guide provides comprehensive instructions for running automated tests on the Portfolix Compass Backend. All tests are automated using Jest and SuperTest, with full coverage reporting and validation.

## Prerequisites

### Required
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 5.0 (local or cloud)
- PostgreSQL >= 13.0 (for Prisma ERM)

### Optional
- Docker (for containerized testing)
- Git (for cloning)

## Setup Instructions

### 1. Install Dependencies

```bash
cd /path/to/portfolix-compass-backend
npm install
```

**Expected Output**:
```
added 487 packages, audited 488 packages in 45s
9 vulnerabilities found
```

### 2. Configure Environment Variables

Copy the example environment file and configure for testing:

```bash
cp .env.example .env.test
```

**`.env.test` Configuration**:
```
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/portfolix-compass-test
POSTGRES_URL=postgresql://user:password@localhost:5432/portfolix_compass_test
JWT_SECRET=test-secret-key-do-not-use-in-production
JWT_REFRESH_SECRET=test-refresh-secret
BCRYPT_ROUNDS=5
```

### 3. Initialize Test Databases

```bash
# MongoDB (local)
mongod --dbpath /path/to/test/db

# PostgreSQL (local)
psql -U postgres -d postgres -c "CREATE DATABASE portfolix_compass_test;"

# Or use Docker
docker run -d --name mongo-test -p 27017:27017 mongo:latest
docker run -d --name postgres-test -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:latest
```

### 4. Run Database Migrations

```bash
# Prisma migrations (for ERM tables)
prisma migrate deploy --skip-generate

# MongoDB seed data (optional)
npm run seed
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm test -- --watch

# Run specific test file
npm test -- src/controllers/__tests__/auth.test.js

# Run tests with coverage
npm test -- --coverage
```

### Test Categories

#### Unit Tests

Test individual functions and methods in isolation:

```bash
npm test -- --testPathPattern="models|utils|helpers"
```

**Coverage Target**: >= 80%

#### Controller Tests

Test API endpoint logic and request handling:

```bash
npm test -- --testPathPattern="controllers"
```

**Coverage Target**: >= 75%

#### Integration Tests

Test multiple components working together:

```bash
npm test -- --testPathPattern="integration"
```

**Coverage Target**: >= 70%

#### Database Tests

Test database operations and queries:

```bash
npm test -- --testPathPattern="models"
```

**Coverage Target**: >= 80%

### Advanced Testing

#### Test with Specific Pattern

```bash
npm test -- --testNamePattern="login"
```

#### Generate HTML Coverage Report

```bash
npm test -- --coverage --collectCoverageFrom='src/**/*.js'
# Open coverage/lcov-report/index.html
```

#### Debug Tests

```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome DevTools.

#### Run Tests in Parallel

```bash
npm test -- --maxWorkers=4
```

## Test Structure

### Directory Layout

```
src/
├── controllers/
│   ├── authController.js
│   └── __tests__/
│       └── auth.test.js
├── models/
│   ├── User.js
│   └── __tests__/
│       └── User.test.js
├── utils/
│   ├── validators.js
│   └── __tests__/
│       └── validators.test.js
└── __tests__/
    ├── integration/
    │   └── auth.integration.test.js
    └── setup.js
```

### Test File Naming

- Unit tests: `*.test.js`
- Integration tests: `*.integration.test.js`
- Spec tests: `*.spec.js`

## Common Test Scenarios

### 1. Authentication Testing

**File**: `src/controllers/__tests__/auth.test.js`

```javascript
describe('Authentication Controller', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      // Test code
    });

    it('should return 401 for invalid credentials', async () => {
      // Test code
    });
  });
});
```

### 2. Database Model Testing

**File**: `src/models/__tests__/User.test.js`

```javascript
describe('User Model', () => {
  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      // Test code
    });
  });
});
```

### 3. API Integration Testing

**File**: `src/__tests__/integration/auth.integration.test.js`

```javascript
describe('Auth API Integration', () => {
  it('complete login and token refresh flow', async () => {
    // Test full flow
  });
});
```

## Error Handling & Fixes

### Issue: MongoDB Connection Timeout

**Error**:
```
Timeout - Async callback was not invoked within 10000ms
```

**Solution**:
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/db

# Or check connection string in .env.test
MONGODB_URI=mongodb://localhost:27017/portfolix-compass-test
```

### Issue: Port Already in Use

**Error**:
```
Error: listen EADDRINUSE :::3001
```

**Solution**:
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port in .env.test
PORT=3002
```

### Issue: Prisma Client Not Generated

**Error**:
```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
prisma generate
```

### Issue: Test Timeout

**Solution**:
Increase timeout in jest.config.js:
```javascript
testTimeout: 15000 // 15 seconds
```

## Coverage Requirements

Minimum coverage thresholds by component:

| Component | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| Controllers | 75% | 70% | 75% | 75% |
| Models | 80% | 75% | 80% | 80% |
| Utils | 85% | 80% | 85% | 85% |
| Middleware | 80% | 75% | 80% | 80% |
| **Overall** | **78%** | **73%** | **78%** | **78%** |

## Validation Checklist

Before committing code, ensure:

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Coverage meets requirements: `npm test -- --coverage`
- [ ] No console errors or warnings
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] No hard-coded secrets in code
- [ ] No TODO/FIXME comments without tracking

## CI/CD Integration

For automated testing in GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo
      postgres:
        image: postgres
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      - run: npm install
      - run: npm test -- --coverage
      - run: npm run lint
```

## Troubleshooting

### Slow Tests

1. Profile tests: `npm test -- --logHeapUsage`
2. Parallelize: `npm test -- --maxWorkers=4`
3. Mock slow dependencies
4. Use in-memory database for unit tests

### Flaky Tests

1. Avoid time-based assertions
2. Use explicit waits instead of timeouts
3. Clean up properly in afterEach hooks
4. Mock external APIs

### Memory Issues

1. Reduce worker count: `npm test -- --maxWorkers=2`
2. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
3. Close database connections in afterAll

## Documentation

For detailed test examples, see:
- `DEVELOPMENT.md` - Development guide
- `README.md` - Project overview
- Jest documentation: https://jestjs.io
- SuperTest documentation: https://github.com/visionmedia/supertest

## Support

For testing issues:
1. Check error logs
2. Verify environment setup
3. Consult troubleshooting section
4. Run with verbose logging: `npm test -- --verbose`
5. Create GitHub issue with test output

---

**Last Updated**: December 3, 2025
**Version**: 1.0.0
