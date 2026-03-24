import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, closeTestApp, truncateTables } from './helpers';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await truncateTables(dataSource);
    await closeTestApp(app);
  });

  afterEach(async () => {
    await truncateTables(dataSource);
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return accessToken, refreshToken, and parent', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePassword123',
          phone: '+5511987654321',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('parent');
      expect(response.body.parent).toHaveProperty('id');
      expect(response.body.parent).toHaveProperty('name', 'John Doe');
      expect(response.body.parent).toHaveProperty('email', 'john@example.com');
      expect(response.body.parent).toHaveProperty('phone', '+5511987654321');
      expect(response.body.parent).toHaveProperty('schoolId');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should return 409 when email is already registered', async () => {
      const registerData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654322',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    it('should register without schoolId (optional field)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Bob Smith',
          email: 'bob@example.com',
          password: 'SecurePassword123',
          phone: '+5511987654323',
          // schoolId intentionally omitted
        })
        .expect(201);

      expect(response.body.parent.schoolId).toBeNull();
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654324',
      });
    });

    it('should login and return accessToken, refreshToken, and parent', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('parent');
      expect(response.body.parent.email).toBe('login@example.com');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should return 401 when password is wrong', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when email is not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Profile Test User',
          email: 'profile@example.com',
          password: 'SecurePassword123',
          phone: '+5511987654325',
        });

      accessToken = response.body.accessToken;
    });

    it('should return parent profile with valid Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Profile Test User');
      expect(response.body).toHaveProperty('email', 'profile@example.com');
      expect(response.body).toHaveProperty('phone', '+5511987654325');
      expect(response.body).toHaveProperty('schoolId');
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200 with any body (stateless logout)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'any_token_value' })
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should return 200 even with empty body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({})
        .expect(200);

      expect(response.body).toEqual({});
    });
  });
});
