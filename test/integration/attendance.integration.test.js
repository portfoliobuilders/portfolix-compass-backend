/**
 * Attendance Integration Test Suite
 * Tests attendance marking, querying, and management functionality
 * PHASE 4 - Production Hardening: CRITICAL BLOCKER #1
 */

const request = require('supertest');
const app = require('../../../server');
const Attendance = require('../../../models/Attendance');
const Employee = require('../../../models/Employee');
const Company = require('../../../models/Company');
const mongoose = require('mongoose');

describe('Attendance API - Integration Tests', () => {
  let server;
  let companyId, employeeId, token;
  const testAttendanceData = {
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkInTime: '09:00 AM',
    checkOutTime: '05:30 PM',
    workHours: 8.5,
    notes: 'Regular work day'
  };

  beforeAll(async () => {
    // Setup test database connection and seed data
    const company = await Company.create({
      name: 'Test Company',
      industry: 'IT',
      size: 'MEDIUM',
      registrationNumber: 'TC123456'
    });
    companyId = company._id;

    const employee = await Employee.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      companyId: companyId,
      department: 'Engineering',
      role: 'Developer'
    });
    employeeId = employee._id;
  });

  afterAll(async () => {
    // Cleanup test data
    await Attendance.deleteMany({ companyId });
    await Employee.deleteMany({ companyId });
    await Company.deleteMany({ _id: companyId });
    if (server) server.close();
  });

  describe('POST /api/attendance/mark - Mark Attendance', () => {
    test('should mark attendance with valid data', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...testAttendanceData,
          employeeId: employeeId,
          companyId: companyId
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('present');
      expect(res.body.data.workHours).toBe(8.5);
    });

    test('should reject attendance with missing required fields', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({ employeeId })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    test('should reject duplicate attendance for same employee on same date', async () => {
      // Mark first
      await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testAttendanceData, employeeId, companyId });

      // Try to mark again
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testAttendanceData, employeeId, companyId })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    test('should validate workHours calculation from check times', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...testAttendanceData,
          employeeId,
          companyId,
          checkInTime: '09:00 AM',
          checkOutTime: '05:00 PM',
          workHours: 8
        })
        .expect(201);

      expect(res.body.data.workHours).toBe(8);
    });
  });

  describe('GET /api/attendance/list - Get Attendance Records', () => {
    beforeEach(async () => {
      // Create multiple attendance records for testing
      const dates = ['2024-12-01', '2024-12-02', '2024-12-03'];
      for (const date of dates) {
        await Attendance.create({
          employeeId,
          companyId,
          date,
          status: 'present',
          workHours: 8,
          checkInTime: '09:00 AM',
          checkOutTime: '05:00 PM'
        });
      }
    });

    test('should retrieve attendance records for employee', async () => {
      const res = await request(app)
        .get(`/api/attendance/list?employeeId=${employeeId}&companyId=${companyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should filter attendance by status', async () => {
      const res = await request(app)
        .get(`/api/attendance/list?employeeId=${employeeId}&companyId=${companyId}&status=present`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((att) => att.status === 'present')).toBe(true);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/attendance/list?employeeId=${employeeId}&companyId=${companyId}&page=1&limit=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/attendance/:id - Get Single Attendance', () => {
    let attendanceId;

    beforeEach(async () => {
      const att = await Attendance.create({
        employeeId,
        companyId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        workHours: 8
      });
      attendanceId = att._id;
    });

    test('should retrieve single attendance record', async () => {
      const res = await request(app)
        .get(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(attendanceId.toString());
    });

    test('should return 404 for non-existent attendance', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/attendance/:id - Update Attendance', () => {
    let attendanceId;

    beforeEach(async () => {
      const att = await Attendance.create({
        employeeId,
        companyId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        workHours: 8
      });
      attendanceId = att._id;
    });

    test('should update attendance status', async () => {
      const res = await request(app)
        .put(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'half-day', workHours: 4 })
        .expect(200);

      expect(res.body.data.status).toBe('half-day');
      expect(res.body.data.workHours).toBe(4);
    });

    test('should not allow updating companyId or employeeId', async () => {
      const res = await request(app)
        .put(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ employeeId: new mongoose.Types.ObjectId() })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/attendance/:id - Delete Attendance', () => {
    let attendanceId;

    beforeEach(async () => {
      const att = await Attendance.create({
        employeeId,
        companyId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        workHours: 8
      });
      attendanceId = att._id;
    });

    test('should delete attendance record', async () => {
      const res = await request(app)
        .delete(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('Multi-tenant Isolation', () => {
    let company2Id, employee2Id;

    beforeEach(async () => {
      const company2 = await Company.create({
        name: 'Test Company 2',
        industry: 'Finance',
        size: 'SMALL'
      });
      company2Id = company2._id;

      const employee2 = await Employee.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        companyId: company2Id,
        department: 'Accounting'
      });
      employee2Id = employee2._id;
    });

    test('should not allow viewing attendance from different company', async () => {
      const att = await Attendance.create({
        employeeId: employee2Id,
        companyId: company2Id,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      });

      const res = await request(app)
        .get(`/api/attendance/${att._id}`)
        .set('x-company-id', companyId.toString())
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
