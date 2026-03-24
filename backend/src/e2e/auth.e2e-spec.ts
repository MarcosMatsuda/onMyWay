import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { truncateTables } from './helpers';

describe('Auth E2E', () => {
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
    it('should register a new parent', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Parent',
          email: 'auth-test@example.com',
          password: 'password123',
          phone: '+5511999999999',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          phone: '+5511999999999',
        })
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Test User',
          email: 'login-test@example.com',
          password: 'password123',
          phone: '+5511999999999',
        })
        .expect(201);

      // Then login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toBeDefined();
    });
  });
});
