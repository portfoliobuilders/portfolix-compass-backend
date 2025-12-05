const request = require('supertest');
const app = require('../../src/server');

describe('Department API Integration Tests', () => {
  const validToken = process.env.TEST_JWT_TOKEN || 'test-token';

  describe('GET /api/department', () => {
    it('should return all departments with 200 status', async () => {
      const response = await request(app)
        .get('/api/department')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/department')
        .expect(401);
    });
  });

  describe('POST /api/department', () => {
    it('should create department with valid data', async () => {
      const deptData = { departmentName: 'Engineering' };

      const response = await request(app)
        .post('/api/department')
        .set('Authorization', `Bearer ${validToken}`)
        .send(deptData)
        .expect(201);
      
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/department/:id', () => {
    it('should return department by ID', async () => {
      const response = await request(app)
        .get('/api/department/dept123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('PUT /api/department/:id', () => {
    it('should update department successfully', async () => {
      const updateData = { departmentName: 'Updated Dept' };
      
      await request(app)
        .put('/api/department/dept123')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
    });
  });

  describe('DELETE /api/department/:id', () => {
    it('should delete department successfully', async () => {
      await request(app)
        .delete('/api/department/dept123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });
});
