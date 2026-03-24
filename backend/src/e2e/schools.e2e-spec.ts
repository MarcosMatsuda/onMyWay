import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { truncateTables, seedSchool } from './helpers';

describe('Schools Endpoints (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testSchoolId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get('DataSource');

    // Seed a test school
    const school = await seedSchool(dataSource);
    testSchoolId = school.id;

    // Register and login to get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Schools Test User',
        email: 'schools-test@example.com',
        password: 'SchoolsPass123',
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

  describe('POST /schools', () => {
    it('should create a new school', async () => {
      const response = await request(app.getHttpServer())
        .post('/schools')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'New School',
          lat: -23.5505,
          lng: -46.6333,
          geofenceRadiusMeters: 1500,
          notificationThresholdMeters: 750,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe('New School');
      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('lat');
      expect(response.body.location).toHaveProperty('lng');
      expect(response.body.location.lat).toBe(-23.5505);
      expect(response.body.location.lng).toBe(-46.6333);
      expect(response.body.geofenceRadiusMeters).toBe(1500);
      expect(response.body.notificationThresholdMeters).toBe(750);
    });
  });

  describe('GET /schools', () => {
    it('should return all schools with nested location', async () => {
      const response = await request(app.getHttpServer())
        .get('/schools')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of first school
      const school = response.body[0];
      expect(school).toHaveProperty('id');
      expect(school).toHaveProperty('name');
      expect(school).toHaveProperty('location');
      expect(school.location).toHaveProperty('lat');
      expect(school.location).toHaveProperty('lng');

      // Verify location is nested, not flat
      expect(school).not.toHaveProperty('lat');
      expect(school).not.toHaveProperty('lng');
    });

    it('should return correct seeded school in list', async () => {
      const response = await request(app.getHttpServer())
        .get('/schools')
        .expect(200);

      const school = response.body.find((s) => s.id === testSchoolId);
      expect(school).toBeDefined();
      expect(school.name).toBe('Test School');
      expect(school.location.lat).toBe(-23.5505);
      expect(school.location.lng).toBe(-46.6333);
    });
  });

  describe('GET /schools/:id', () => {
    it('should return single school by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/schools/${testSchoolId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(testSchoolId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('lat');
      expect(response.body.location).toHaveProperty('lng');
    });

    it('should return 404 for unknown school id', async () => {
      const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

      await request(app.getHttpServer()).get(`/schools/${fakeId}`).expect(404);
    });
  });

  describe('GET /schools/:id/arrivals', () => {
    it('should return empty arrivals array when no parents inside geofence', async () => {
      const response = await request(app.getHttpServer())
        .get(`/schools/${testSchoolId}/arrivals`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /schools/:id/stats', () => {
    it('should return school stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/schools/${testSchoolId}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('totalParents');
      expect(response.body).toHaveProperty('avgETA');
      expect(response.body).toHaveProperty('etaLessThan5Min');
      expect(response.body).toHaveProperty('eta5To15Min');
      expect(response.body).toHaveProperty('etaGreaterThan15Min');
      expect(typeof response.body.totalParents).toBe('number');
      expect(typeof response.body.avgETA).toBe('number');
    });
  });
});
