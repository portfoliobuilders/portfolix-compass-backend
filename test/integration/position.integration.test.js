const request = require('supertest');
const app = require('../../src/server');

describe('Position API Integration Tests', () => {
  const validToken = process.env.TEST_JWT_TOKEN || 'test-token';

  describe('CRUD Operations', () => {
    it('GET /api/position - should return all positions', async () => {
      await request(app)
        .get('/api/position')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('POST /api/position - should create position', async () => {
      await request(app)
        .post('/api/position')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ positionTitle: 'Manager' })
        .expect(201);
    });

    it('GET /api/position/:id - should return position by ID', async () => {
      await request(app)
        .get('/api/position/pos123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('PUT /api/position/:id - should update position', async () => {
      await request(app)
        .put('/api/position/pos123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ positionTitle: 'Senior Manager' })
        .expect(200);
    });

    it('DELETE /api/position/:id - should delete position', async () => {
      await request(app)
        .delete('/api/position/pos123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/position')
        .expect(401);
    });
  });
});
