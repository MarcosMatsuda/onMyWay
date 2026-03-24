import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { truncateTables, seedSchool } from './helpers';

describe('Locations Endpoints (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get('DataSource');

    // Seed a test school
    await seedSchool(dataSource);

    // Register and login to get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Locations Test User',
        email: 'locations-test@example.com',
        password: 'LocationsPass123',
      });

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    const dataSource = app.get('DataSource');
    if (dataSource && dataSource.isInitialized) {
      await truncateTables(dataSource);
    }
    await app.close();
  });

  describe('POST /locations', () => {
    it('should save location inside geofence', async () => {
      // School is at -23.5505, -46.6333 with 1000m geofence
      // This point is approximately 300m away (inside geofence)
      const response = await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lat: -23.554,
          lng: -46.636,
          accuracy: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('saved');
      expect(response.body.saved).toBe(true);
      expect(response.body).toHaveProperty('withinGeofence');
      expect(response.body.withinGeofence).toBe(true);
    });

    it('should save location outside geofence', async () => {
      // Point 5km away from school
      const response = await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lat: -23.6005,
          lng: -46.6833,
          accuracy: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('saved');
      expect(response.body.saved).toBe(true);
      expect(response.body).toHaveProperty('withinGeofence');
      expect(response.body.withinGeofence).toBe(false);
    });

    it('should return 401 without Bearer token', async () => {
      await request(app.getHttpServer())
        .post('/locations')
        .send({
          lat: -23.5505,
          lng: -46.6333,
          accuracy: 10,
        })
        .expect(401);
    });
  });

  describe('GET /locations/me', () => {
    it('should return current location after posting', async () => {
      // First, post a location
      await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lat: -23.5505,
          lng: -46.6333,
          accuracy: 15,
        })
        .expect(200);

      // Then, retrieve it
      const response = await request(app.getHttpServer())
        .get('/locations/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.lat).toBe(-23.5505);
      expect(response.body.lng).toBe(-46.6333);
      expect(response.body.accuracy).toBe(15);
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return 401 without Bearer token', async () => {
      await request(app.getHttpServer()).get('/locations/me').expect(401);
    });
  });
});
