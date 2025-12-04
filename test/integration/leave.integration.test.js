/**
 * Leave Integration Test Suite
 * Tests leave request, approval, and management functionality
 * PHASE 4 - Production Hardening: CRITICAL BLOCKER #1
 */

const request = require('supertest');
const app = require('../../../server');
const Leave = require('../../../models/Leave');
const Employee = require('../../../models/Employee');
const Company = require('../../../models/Company');
const mongoose = require('mongoose');

describe('Leave API - Integration Tests', () => {
  let companyId, employeeId, managerId, hrUserId, token;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const baseLeaveData = {
    leaveType: 'CASUAL',
    startDate: tomorrow,
    endDate: nextWeek,
    reason: 'Personal reason',
    numberOfDays: 5
  };

  beforeAll(async () => {
    // Setup test company and employees
    const company = await Company.create({
      name: 'Leave Test Company',
      industry: 'IT',
      size: 'MEDIUM',
      registrationNumber: 'LTC123456'
    });
    companyId = company._id;

    const emp = await Employee.create({
      firstName: 'Test',
      lastName: 'Employee',
      email: 'emp@test.com',
      companyId,
      department: 'Engineering',
      role: 'Developer'
    });
    employeeId = emp._id;

    const manager = await Employee.create({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@test.com',
      companyId,
      department: 'Management',
      role: 'Team Lead'
    });
    managerId = manager._id;

    const hr = await Employee.create({
      firstName: 'HR',
      lastName: 'Admin',
      email: 'hr@test.com',
      companyId,
      department: 'HR',
      role: 'HR Manager'
    });
    hrUserId = hr._id;
  });

  afterAll(async () => {
    // Cleanup
    await Leave.deleteMany({ companyId });
    await Employee.deleteMany({ companyId });
    await Company.deleteMany({ _id: companyId });
  });

  describe('POST /api/leave/apply - Apply Leave', () => {
    test('should apply leave with valid data', async () => {
      const res = await request(app)
        .post('/api/leave/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...baseLeaveData,
          employeeId,
          companyId
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.leaveType).toBe('CASUAL');
      expect(res.body.data.numberOfDays).toBe(5);
    });

    test('should reject leave without required fields', async () => {
      const res = await request(app)
        .post('/api/leave/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ employeeId, companyId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject leave with invalid type', async () => {
      const res = await request(app)
        .post('/api/leave/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...baseLeaveData, leaveType: 'INVALID', employeeId, companyId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject leave with end date before start date', async () => {
      const res = await request(app)
        .post('/api/leave/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...baseLeaveData,
          startDate: nextWeek,
          endDate: tomorrow,
          employeeId,
          companyId
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/leave/list - Get Leave Requests', () => {
    beforeEach(async () => {
      // Create multiple leave requests
      const leaveTypes = ['CASUAL', 'SICK', 'ANNUAL'];
      for (const type of leaveTypes) {
        await Leave.create({
          ...baseLeaveData,
          leaveType: type,
          employeeId,
          companyId,
          status: 'PENDING'
        });
      }
    });

    test('should retrieve leave requests for employee', async () => {
      const res = await request(app)
        .get(`/api/leave/list?employeeId=${employeeId}&companyId=${companyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should filter leave by status', async () => {
      const res = await request(app)
        .get(`/api/leave/list?employeeId=${employeeId}&companyId=${companyId}&status=PENDING`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((l) => l.status === 'PENDING')).toBe(true);
    });

    test('should filter leave by type', async () => {
      const res = await request(app)
        .get(`/api/leave/list?employeeId=${employeeId}&companyId=${companyId}&leaveType=CASUAL`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((l) => l.leaveType === 'CASUAL')).toBe(true);
    });
  });

  describe('PUT /api/leave/:id/approve - Approve Leave', () => {
    let leaveId;

    beforeEach(async () => {
      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId,
        companyId,
        status: 'PENDING',
        requestedBy: employeeId
      });
      leaveId = leave._id;
    });

    test('should approve pending leave request', async () => {
      const res = await request(app)
        .put(`/api/leave/${leaveId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          approvedBy: managerId,
          approvalNotes: 'Approved'
        })
        .expect(200);

      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.approvedBy.toString()).toBe(managerId.toString());
    });

    test('should not allow employee to approve own leave', async () => {
      const res = await request(app)
        .put(`/api/leave/${leaveId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ approvedBy: employeeId })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/leave/:id/reject - Reject Leave', () => {
    let leaveId;

    beforeEach(async () => {
      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId,
        companyId,
        status: 'PENDING',
        requestedBy: employeeId
      });
      leaveId = leave._id;
    });

    test('should reject pending leave request', async () => {
      const res = await request(app)
        .put(`/api/leave/${leaveId}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectedBy: managerId,
          rejectionReason: 'Insufficient coverage'
        })
        .expect(200);

      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectedBy.toString()).toBe(managerId.toString());
    });
  });

  describe('GET /api/leave/:id - Get Single Leave Request', () => {
    let leaveId;

    beforeEach(async () => {
      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId,
        companyId,
        status: 'PENDING'
      });
      leaveId = leave._id;
    });

    test('should retrieve single leave request', async () => {
      const res = await request(app)
        .get(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(leaveId.toString());
    });

    test('should return 404 for non-existent leave', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/leave/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/leave/:id - Update Leave Request', () => {
    let leaveId;

    beforeEach(async () => {
      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId,
        companyId,
        status: 'PENDING'
      });
      leaveId = leave._id;
    });

    test('should update pending leave request', async () => {
      const res = await request(app)
        .put(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Updated reason',
          numberOfDays: 3
        })
        .expect(200);

      expect(res.body.data.reason).toBe('Updated reason');
      expect(res.body.data.numberOfDays).toBe(3);
    });

    test('should not allow updating approved leave', async () => {
      await Leave.findByIdAndUpdate(leaveId, { status: 'APPROVED' });

      const res = await request(app)
        .put(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Updated reason' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/leave/:id - Cancel Leave Request', () => {
    let leaveId;

    beforeEach(async () => {
      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId,
        companyId,
        status: 'PENDING'
      });
      leaveId = leave._id;
    });

    test('should cancel pending leave request', async () => {
      const res = await request(app)
        .delete(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('should not allow canceling approved leave', async () => {
      await Leave.findByIdAndUpdate(leaveId, { status: 'APPROVED' });

      const res = await request(app)
        .delete(`/api/leave/${leaveId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Multi-tenant Leave Isolation', () => {
    test('should not allow viewing leaves from different company', async () => {
      const company2 = await Company.create({
        name: 'Another Company',
        industry: 'Finance',
        size: 'SMALL'
      });

      const emp2 = await Employee.create({
        firstName: 'Other',
        lastName: 'Employee',
        email: 'other@test.com',
        companyId: company2._id,
        department: 'Finance'
      });

      const leave = await Leave.create({
        ...baseLeaveData,
        employeeId: emp2._id,
        companyId: company2._id,
        status: 'PENDING'
      });

      const res = await request(app)
        .get(`/api/leave/${leave._id}`)
        .set('x-company-id', companyId.toString())
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);

      // Cleanup
      await Company.findByIdAndDelete(company2._id);
      await Employee.findByIdAndDelete(emp2._id);
      await Leave.findByIdAndDelete(leave._id);
    });
  });
});
