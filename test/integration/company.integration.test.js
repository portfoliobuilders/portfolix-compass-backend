const request = require('supertest');
const app = require('../../src/server');

describe('Company API Integration Tests', () => {
  const validToken = process.env.TEST_JWT_TOKEN || 'test-token';

  describe('GET /api/companies', () => {
    it('should return all companies with 200 status', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/companies')
        .expect(401);
    });
  });

  describe('POST /api/companies', () => {
    it('should create company with valid data', async () => {
      const companyData = {
        companyName: 'Test Company',
        registrationNumber: 'REG123'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${validToken}`)
        .send(companyData)
        .expect(201);
      
      expect(response.body).toHaveProperty('data');
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should return company by ID with 200 status', async () => {
      const response = await request(app)
        .get('/api/companies/comp123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('companyId');
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company successfully', async () => {
      const updateData = { companyName: 'Updated Company' };
      
      const response = await request(app)
        .put('/api/companies/comp123')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('companyId');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete company successfully', async () => {
      const response = await request(app)
        .delete('/api/companies/comp123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
    });
  });
});
