import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, closeTestApp, truncateTables, seedSchool } from './helpers';

describe('Schools E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);

    // Seed a school
    await seedSchool(dataSource);

    // Register and login a test parent
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Parent',
        email: 'parent@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654321',
      });

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await truncateTables(dataSource);
    await closeTestApp(app);
  });

  afterEach(async () => {
    await truncateTables(dataSource);
    await seedSchool(dataSource);
  });

  describe('Schools', () => {
    it('should create a school with nested location shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/schools')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'New School',
          lat: -23.5505,
          lng: -46.6333,
          geofenceRadiusMeters: 1000,
          notificationThresholdMeters: 500,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New School');
      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('lat', -23.5505);
      expect(response.body.location).toHaveProperty('lng', -46.6333);
    });

    it('should list schools with nested location shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/schools')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const school = response.body[0];
      expect(school).toHaveProperty('location');
      expect(school.location).toHaveProperty('lat');
      expect(school.location).toHaveProperty('lng');
      expect(school).not.toHaveProperty('lat');
      expect(school).not.toHaveProperty('lng');
    });

    it('should get a single school by id', async () => {
      const school = await seedSchool(dataSource);
      const response = await request(app.getHttpServer())
        .get(`/schools/${school.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('lat');
    });

    it('should return 404 for unknown school id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/schools/${fakeId}`)
        .expect(404);
    });

    it('should get arrivals queue as flat array', async () => {
      const school = await seedSchool(dataSource);
      const response = await request(app.getHttpServer())
        .get(`/schools/${school.id}/arrivals`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get school stats', async () => {
      const school = await seedSchool(dataSource);
      const response = await request(app.getHttpServer())
        .get(`/schools/${school.id}/stats`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalParents');
      expect(response.body).toHaveProperty('avgETA');
    });
  });
});
