import request from 'supertest';
import app from '../app.js';

describe('Authentication Endpoints', () => {
  describe('POST /v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});

