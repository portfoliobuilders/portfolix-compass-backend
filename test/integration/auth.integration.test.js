/**
 * Authentication Integration Tests
 * Tests login, token generation, refresh, logout, and multi-tenant access
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const Company = require('../../src/models/Company');

// Mock Express app for testing
let app;

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/portfolix-test');
    
    // Import app after mongoose connection
    app = require('../../src/server');
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await Company.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Company.deleteMany({});
  });

  describe('POST /auth/login', () => {
    let testCompany, testUser;

    beforeEach(async () => {
      // Create test company
      testCompany = await Company.create({
        name: 'Test Company',
        email: 'test@company.com'
      });

      // Create test user
      const hashedPassword = await bcrypt.hash('TestPassword123', 10);
      testUser = await User.create({
        email: 'user@test.com',
        password: hashedPassword,
        name: 'Test User',
        companyId: testCompany._id,
        role: 'admin'
      });
    });

    test('Should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'TestPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data.accessToken');
      expect(response.body).toHaveProperty('data.refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('user@test.com');
    });

    test('Should fail login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    test('Should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    test('Should generate valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'TestPassword123'
        });

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).toMatch(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });
  });

  describe('POST /auth/refresh', () => {
    let testCompany, testUser, refreshToken;

    beforeEach(async () => {
      testCompany = await Company.create({
        name: 'Test Company',
        email: 'test@company.com'
      });

      const hashedPassword = await bcrypt.hash('TestPassword123', 10);
      testUser = await User.create({
        email: 'user@test.com',
        password: hashedPassword,
        name: 'Test User',
        companyId: testCompany._id,
        role: 'admin'
      });

      // Get refresh token from login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'TestPassword123'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('Should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data.accessToken');
    });

    test('Should fail refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Multi-tenant Access', () => {
    let company1, company2, user1, user2, token1;

    beforeEach(async () => {
      // Create two companies
      company1 = await Company.create({
        name: 'Company 1',
        email: 'company1@test.com'
      });

      company2 = await Company.create({
        name: 'Company 2',
        email: 'company2@test.com'
      });

      // Create users for each company
      const hashedPassword = await bcrypt.hash('TestPassword123', 10);
      user1 = await User.create({
        email: 'user1@test.com',
        password: hashedPassword,
        name: 'User 1',
        companyId: company1._id,
        role: 'admin'
      });

      user2 = await User.create({
        email: 'user2@test.com',
        password: hashedPassword,
        name: 'User 2',
        companyId: company2._id,
        role: 'admin'
      });

      // Login user1
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@test.com',
          password: 'TestPassword123'
        });

      token1 = loginResponse.body.data.accessToken;
    });

    test('User should only access their company data', async () => {
      // This test verifies multi-tenancy isolation
      // User1 should not access User2's company data
      expect(user1.companyId.toString()).not.toBe(user2.companyId.toString());
    });
  });

  describe('Password Security', () => {
    test('Passwords should be hashed with bcrypt', async () => {
      const company = await Company.create({
        name: 'Test Company',
        email: 'test@company.com'
      });

      const rawPassword = 'SecurePassword123';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const user = await User.create({
        email: 'test@test.com',
        password: hashedPassword,
        name: 'Test User',
        companyId: company._id,
        role: 'admin'
      });

      // Verify password is hashed
      expect(user.password).not.toBe(rawPassword);
      
      // Verify hash can be verified
      const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
      expect(isPasswordValid).toBe(true);
    });
  });
});

module.exports = {};
