import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import {
  createTestApp,
  closeTestApp,
  truncateTables,
  seedSchool,
} from './helpers';

describe('Locations E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let schoolLat: number;
  let schoolLng: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);

    const school = await seedSchool(dataSource);
    schoolLat = school.lat;
    schoolLng = school.lng;

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
  });

  describe('POST /locations', () => {
    it('should save location with token', async () => {
      const response = await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lat: schoolLat + 0.003,
          lng: schoolLng + 0.003,
          accuracy: 20,
        })
        .expect(200);

      expect(response.body).toHaveProperty('saved', true);
      expect(response.body).toHaveProperty('withinGeofence');
    });

    it('should return 401 without Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .post('/locations')
        .send({
          lat: schoolLat,
          lng: schoolLng,
          accuracy: 20,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /locations/me', () => {
    it('should return latest location after posting', async () => {
      await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lat: -23.5505,
          lng: -46.6333,
          accuracy: 20,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/locations/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 401 without Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/locations/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
