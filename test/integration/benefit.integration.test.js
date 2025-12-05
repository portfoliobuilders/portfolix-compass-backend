const request = require('supertest');
const app = require('../../src/server');

describe('Benefit API Integration Tests', () => {
  const validToken = process.env.TEST_JWT_TOKEN || 'test-token';

  describe('CRUD Operations', () => {
    it('GET /api/benefit - should return all benefits', async () => {
      await request(app)
        .get('/api/benefit')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('POST /api/benefit - should create benefit', async () => {
      await request(app)
        .post('/api/benefit')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ benefitName: 'Health Insurance', description: 'Medical coverage' })
        .expect(201);
    });

    it('GET /api/benefit/:id - should return benefit by ID', async () => {
      await request(app)
        .get('/api/benefit/ben123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('PUT /api/benefit/:id - should update benefit', async () => {
      await request(app)
        .put('/api/benefit/ben123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ benefitName: 'Premium Health Insurance' })
        .expect(200);
    });

    it('DELETE /api/benefit/:id - should delete benefit', async () => {
      await request(app)
        .delete('/api/benefit/ben123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });

  describe('Authentication Tests', () => {
    it('should reject requests without authorization', async () => {
      await request(app)
        .get('/api/benefit')
        .expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app)
        .get('/api/benefit')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
