const request = require('supertest');
const app = require('../../src/server');

describe('JobGrade API Integration Tests', () => {
  const validToken = process.env.TEST_JWT_TOKEN || 'test-token';

  describe('CRUD Operations', () => {
    it('GET /api/job-grade - should return all job grades', async () => {
      await request(app)
        .get('/api/job-grade')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('POST /api/job-grade - should create job grade', async () => {
      await request(app)
        .post('/api/job-grade')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ gradeName: 'A1', level: 1 })
        .expect(201);
    });

    it('GET /api/job-grade/:id - should return job grade by ID', async () => {
      await request(app)
        .get('/api/job-grade/grade123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('PUT /api/job-grade/:id - should update job grade', async () => {
      await request(app)
        .put('/api/job-grade/grade123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ gradeName: 'A2' })
        .expect(200);
    });

    it('DELETE /api/job-grade/:id - should delete job grade', async () => {
      await request(app)
        .delete('/api/job-grade/grade123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/job-grade')
        .expect(401);
    });
  });
});
