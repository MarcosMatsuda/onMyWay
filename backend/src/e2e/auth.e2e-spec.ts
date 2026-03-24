import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { truncateTables } from './helpers';

describe('Auth Endpoints (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get('DataSource');
    if (dataSource && dataSource.isInitialized) {
      await truncateTables(dataSource);
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register new parent successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123',
          phone: '+5511987654321',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('parent');
      expect(response.body.parent).toHaveProperty('id');
      expect(response.body.parent).toHaveProperty('name');
      expect(response.body.parent).toHaveProperty('email');
      expect(response.body.parent).toHaveProperty('phone');
      expect(response.body.parent.email).toBe('john@example.com');
      expect(response.body.parent.name).toBe('John Doe');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should register without schoolId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePass123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.parent.schoolId).toBeNull();
    });

    it('should return 409 when email already registered', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'SecurePass123',
        })
        .expect(201);

      // Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Bob',
          email: 'alice@example.com',
          password: 'DifferentPass123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already registered');
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: 'SecurePass123',
        })
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Weak Password',
          email: 'weak@example.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user for each login test
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'LoginPass123',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('parent');
      expect(response.body.parent.email).toBe('login@example.com');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should return 401 with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when email not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Profile Test',
          email: 'profile@example.com',
          password: 'ProfilePass123',
        });

      accessToken = registerResponse.body.accessToken;
    });

    it('should return profile with valid Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('phone');
      expect(response.body.email).toBe('profile@example.com');
    });

    it('should return 401 without Bearer token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully and return empty object', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({})
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should logout with refreshToken in body', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Logout Test',
          email: 'logout@example.com',
          password: 'LogoutPass123',
        });

      const refreshToken = registerResponse.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toEqual({});
    });
  });
});
