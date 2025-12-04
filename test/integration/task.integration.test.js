/**
 * Task Integration Test Suite
 * Tests task creation, assignment, status management, and workflow
 * PHASE 4 - Production Hardening: CRITICAL BLOCKER #1
 */

const request = require('supertest');
const app = require('../../../server');
const Task = require('../../../models/Task');
const Employee = require('../../../models/Employee');
const Company = require('../../../models/Company');
const mongoose = require('mongoose');

describe('Task API - Integration Tests', () => {
  let companyId, managerId, assigneeId, token;
  const baseTaskData = {
    title: 'Backend API Development',
    description: 'Develop RESTful APIs for ERM system',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedHours: 40
  };

  beforeAll(async () => {
    // Setup test company and employees
    const company = await Company.create({
      name: 'Task Test Company',
      industry: 'Technology',
      size: 'LARGE',
      registrationNumber: 'TTC123456'
    });
    companyId = company._id;

    const manager = await Employee.create({
      firstName: 'Bob',
      lastName: 'Manager',
      email: 'bob@test.com',
      companyId,
      department: 'Engineering',
      role: 'Engineering Manager'
    });
    managerId = manager._id;

    const assignee = await Employee.create({
      firstName: 'Alice',
      lastName: 'Developer',
      email: 'alice@test.com',
      companyId,
      department: 'Engineering',
      role: 'Senior Developer'
    });
    assigneeId = assignee._id;
  });

  afterAll(async () => {
    // Cleanup
    await Task.deleteMany({ companyId });
    await Employee.deleteMany({ companyId });
    await Company.deleteMany({ _id: companyId });
  });

  describe('POST /api/task/create - Create Task', () => {
    test('should create task with valid data', async () => {
      const res = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...baseTaskData,
          companyId,
          createdBy: managerId
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Backend API Development');
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.createdBy.toString()).toBe(managerId.toString());
    });

    test('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...baseTaskData, title: null, companyId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject task with invalid priority', async () => {
      const res = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...baseTaskData, priority: 'INVALID', companyId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should set default status as OPEN', async () => {
      const res = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...baseTaskData, companyId, createdBy: managerId })
        .expect(201);

      expect(res.body.data.status).toBe('OPEN');
    });
  });

  describe('POST /api/task/:id/assign - Assign Task', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        ...baseTaskData,
        companyId,
        createdBy: managerId,
        status: 'OPEN'
      });
      taskId = task._id;
    });

    test('should assign task to employee', async () => {
      const res = await request(app)
        .post(`/api/task/${taskId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedTo: assigneeId })
        .expect(200);

      expect(res.body.data.assignedTo.toString()).toBe(assigneeId.toString());
      expect(res.body.data.status).toBe('ASSIGNED');
    });

    test('should reject assignment to non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/task/${taskId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedTo: fakeId })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/task/:id/status - Update Task Status', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        ...baseTaskData,
        companyId,
        createdBy: managerId,
        assignedTo: assigneeId,
        status: 'ASSIGNED'
      });
      taskId = task._id;
    });

    test('should update task status to IN_PROGRESS', async () => {
      const res = await request(app)
        .put(`/api/task/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('should update task status to COMPLETED', async () => {
      // First set to IN_PROGRESS
      await request(app)
        .put(`/api/task/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });

      // Then complete
      const res = await request(app)
        .put(`/api/task/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED', completedAt: new Date().toISOString() })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
    });

    test('should reject invalid status transition', async () => {
      const res = await request(app)
        .put(`/api/task/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should not allow status change by unauthorized user', async () => {
      const res = await request(app)
        .put(`/api/task/${taskId}/status`)
        .set('Authorization', `Bearer invalid_token`)
        .send({ status: 'IN_PROGRESS' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/task/list - Get Tasks with Filters', () => {
    beforeEach(async () => {
      // Create multiple tasks with different statuses
      const tasks = [
        { status: 'OPEN', priority: 'HIGH' },
        { status: 'ASSIGNED', priority: 'MEDIUM' },
        { status: 'IN_PROGRESS', priority: 'HIGH' },
        { status: 'COMPLETED', priority: 'LOW' }
      ];

      for (const task of tasks) {
        await Task.create({
          ...baseTaskData,
          ...task,
          companyId,
          createdBy: managerId,
          assignedTo: task.status !== 'OPEN' ? assigneeId : null
        });
      }
    });

    test('should retrieve all tasks for company', async () => {
      const res = await request(app)
        .get(`/api/task/list?companyId=${companyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should filter tasks by status', async () => {
      const res = await request(app)
        .get(`/api/task/list?companyId=${companyId}&status=COMPLETED`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((t) => t.status === 'COMPLETED')).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      const res = await request(app)
        .get(`/api/task/list?companyId=${companyId}&priority=HIGH`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((t) => t.priority === 'HIGH')).toBe(true);
    });

    test('should filter tasks by assigned employee', async () => {
      const res = await request(app)
        .get(`/api/task/list?companyId=${companyId}&assignedTo=${assigneeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((t) => t.assignedTo?.toString() === assigneeId.toString())).toBe(true);
    });
  });

  describe('PUT /api/task/:id - Update Task', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        ...baseTaskData,
        companyId,
        createdBy: managerId
      });
      taskId = task._id;
    });

    test('should update task details', async () => {
      const res = await request(app)
        .put(`/api/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated description',
          priority: 'CRITICAL',
          estimatedHours: 60
        })
        .expect(200);

      expect(res.body.data.title).toBe('Updated Task Title');
      expect(res.body.data.priority).toBe('CRITICAL');
      expect(res.body.data.estimatedHours).toBe(60);
    });

    test('should not allow updating companyId', async () => {
      const newCompanyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ companyId: newCompanyId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/task/:id - Delete Task', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        ...baseTaskData,
        companyId,
        createdBy: managerId,
        status: 'OPEN'
      });
      taskId = task._id;
    });

    test('should delete open task', async () => {
      const res = await request(app)
        .delete(`/api/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('should not delete completed task', async () => {
      await Task.findByIdAndUpdate(taskId, { status: 'COMPLETED' });

      const res = await request(app)
        .delete(`/api/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Multi-tenant Task Isolation', () => {
    test('should not allow viewing tasks from different company', async () => {
      const company2 = await Company.create({
        name: 'Another Company',
        industry: 'Finance',
        size: 'SMALL'
      });

      const task = await Task.create({
        ...baseTaskData,
        companyId: company2._id,
        createdBy: managerId
      });

      const res = await request(app)
        .get(`/api/task/${task._id}`)
        .set('x-company-id', companyId.toString())
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);

      // Cleanup
      await Company.findByIdAndDelete(company2._id);
      await Task.findByIdAndDelete(task._id);
    });
  });
});
