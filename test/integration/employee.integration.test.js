/**
 * PHASE 6: Integration Tests for Employee Management System
 * Tests: Create employee, sync to ERM, retry logic, error handling
 * Framework: Jest / Mocha
 * Date: December 4, 2025
 * Status: Production-Ready Test Suite
 */

const request = require('supertest');
const app = require('../../app-phase6');
const { Employee } = require('../../src/models');
const SyncLog = require('../../src/models/SyncLog');
const ermSyncService = require('../../src/services/erm-sync-fix.service');

describe('Employee Management Integration Tests - PHASE 6', () => {
  let testEmployeeId = 'EMP-TEST-001';
  let testCorrelationId;

  // Test setup
  beforeEach(async () => {
    // Mock ERM service responses
    jest.spyOn(ermSyncService, 'syncEmployeeToERM').mockResolvedValue({
      success: true,
      ermId: 'ERM-001',
      attempts: 1
    });
  });

  // Cleanup
  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe('POST /api/employees - Create Employee', () => {
    it('should create employee and sync to ERM successfully', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          employeeId: testEmployeeId,
          department: 'Engineering',
          designation: 'Senior Developer'
        })
        .expect(201);

      testCorrelationId = response.body.correlationId;

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('synced to ERM successfully');
      expect(response.body.correlationId).toBeDefined();
      expect(response.body.employee).toHaveProperty('hrmId');
      expect(response.body.employee).toHaveProperty('ermId');
      expect(response.body.syncMetrics).toHaveProperty('attempts', 1);
      expect(response.body.syncMetrics).toHaveProperty('responseTime');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'John'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
      expect(response.body.correlationId).toBeDefined();
    });

    it('should handle ERM sync failure and return 202', async () => {
      ermSyncService.syncEmployeeToERM.mockResolvedValueOnce({
        success: false,
        error: 'ERM API timeout',
        attempts: 3
      });

      const response = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          employeeId: 'EMP-002',
          department: 'HR',
          designation: 'HR Manager'
        })
        .expect(202);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ERM sync failed');
      expect(response.body.error).toBe('ERM API timeout');
      expect(response.body.retryInfo).toHaveProperty('attempts', 3);
      expect(response.body.retryInfo).toHaveProperty('nextRetryIn');
    });

    it('should enforce rate limiting (5 requests/minute per user)', async () => {
      // Make 6 requests rapidly
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/employees')
          .send({
            firstName: `Test${i}`,
            lastName: 'User',
            email: `test${i}@company.com`,
            employeeId: `EMP-${i}`,
            department: 'Test',
            designation: 'Test'
          });

        if (i < 5) {
          expect([201, 202]).toContain(response.status);
        } else {
          expect(response.status).toBe(429); // Too Many Requests
        }
      }
    });

    it('should inject and track correlation ID', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'Correlation',
          lastName: 'Test',
          email: 'corr@test.com',
          employeeId: 'EMP-CORR-001',
          department: 'Test',
          designation: 'Test'
        })
        .expect(201);

      const correlationId = response.body.correlationId;
      expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Verify correlation ID is in sync logs
      const syncLog = await SyncLog.findOne({ correlationId });
      expect(syncLog).toBeDefined();
      expect(syncLog.operation).toBe('CREATE_EMPLOYEE');
    });
  });

  describe('PUT /api/employees/:employeeId/terminate - Terminate Employee', () => {
    it('should terminate employee and sync to ERM', async () => {
      const response = await request(app)
        .put(`/api/employees/${testEmployeeId}/terminate`)
        .send({
          reason: 'Resignation',
          lastWorkingDay: '2025-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('terminated and synced');
      expect(response.body.terminationData).toHaveProperty('status', 'terminated');
      expect(response.body.terminationData).toHaveProperty('terminationReason', 'Resignation');
      expect(response.body.syncMetrics).toHaveProperty('attempts');
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .put('/api/employees/NON-EXISTENT/terminate')
        .send({
          reason: 'N/A',
          lastWorkingDay: '2025-12-31'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should validate termination request body', async () => {
      const response = await request(app)
        .put(`/api/employees/${testEmployeeId}/terminate`)
        .send({
          // Missing required fields
          reason: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/employees/:employeeId/sync-status - Sync Status', () => {
    it('should retrieve employee sync status and history', async () => {
      const response = await request(app)
        .get(`/api/employees/${testEmployeeId}/sync-status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.employee).toHaveProperty('hrmId');
      expect(response.body.employee).toHaveProperty('syncStatus');
      expect(response.body.employee).toHaveProperty('ermId');
      expect(Array.isArray(response.body.syncHistory)).toBe(true);
      expect(response.body.syncHistory.length).toBeLessThanOrEqual(10);
    });

    it('should show sync history with correct fields', async () => {
      const response = await request(app)
        .get(`/api/employees/${testEmployeeId}/sync-status`)
        .expect(200);

      if (response.body.syncHistory.length > 0) {
        const syncRecord = response.body.syncHistory[0];
        expect(syncRecord).toHaveProperty('syncId');
        expect(syncRecord).toHaveProperty('operation');
        expect(syncRecord).toHaveProperty('status');
        expect(syncRecord).toHaveProperty('attempts');
        expect(syncRecord).toHaveProperty('responseTime');
        expect(syncRecord).toHaveProperty('timestamp');
      }
    });
  });

  describe('Middleware Integration Tests', () => {
    it('should apply correlation ID to all requests', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'Middleware',
          lastName: 'Test',
          email: 'mw@test.com',
          employeeId: 'EMP-MW-001',
          department: 'Test',
          designation: 'Test'
        });

      expect(response.body.correlationId).toBeDefined();
      expect(typeof response.body.correlationId).toBe('string');
    });

    it('should handle errors with correlation ID', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          // Invalid payload
          firstName: 123 // Should be string
        })
        .expect(400);

      expect(response.body.correlationId).toBeDefined();
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
      expect(response.body.correlationId).toBeDefined();
      expect(Array.isArray(response.body.availableEndpoints)).toBe(true);
    });
  });

  describe('Health and Status Endpoints', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('correlationId');
    });

    it('should return API version', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);

      expect(response.body.version).toBe('2.0.0');
      expect(response.body.phase).toContain('PHASE 6');
      expect(response.body).toHaveProperty('deployedAt');
      expect(response.body).toHaveProperty('correlationId');
    });
  });
});

// Test Summary:
// Total test cases: 15+
// Coverage:
// - Employee creation with ERM sync
// - Validation and error handling
// - Rate limiting enforcement
// - Correlation ID injection and tracking
// - Employee termination
// - Sync status retrieval
// - Middleware integration
// - Health check endpoints
// - 404 error handling
//
// Run tests: npm run test:integration
// Generate coverage: npm run test:coverage
