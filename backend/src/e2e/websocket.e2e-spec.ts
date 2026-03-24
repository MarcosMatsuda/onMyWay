import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { truncateTables, seedSchool } from './helpers';

describe('WebSocket Arrivals (E2E)', () => {
  let app: INestApplication;
  let httpServer: any;
  let accessToken: string;
  let testSchoolId: string;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    httpServer = app.getHttpServer();
    await app.init();

    const dataSource = app.get('DataSource');

    // Seed a test school
    const school = await seedSchool(dataSource);
    testSchoolId = school.id;

    // Register and login to get token
    const registerResponse = await request(httpServer)
      .post('/auth/register')
      .send({
        name: 'WebSocket Test User',
        email: 'websocket-test@example.com',
        password: 'WebSocketPass123',
      });

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    const dataSource = app.get('DataSource');
    if (dataSource && dataSource.isInitialized) {
      await truncateTables(dataSource);
    }
    await app.close();
  });

  describe('arrivals:updated event', () => {
    beforeEach((done) => {
      // Connect client socket before each test
      const port = httpServer.address().port;
      clientSocket = ioClient(`http://localhost:${port}`, {
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionDelayMax: 1000,
        reconnectionAttempts: 5,
      });

      clientSocket.on('connect', () => {
        // Join the school room
        clientSocket.emit('joinSchool', { schoolId: testSchoolId });
        done();
      });

      clientSocket.on('connect_error', () => {
        done(new Error('Failed to connect to WebSocket'));
      });
    });

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
        done();
      } else {
        done();
      }
    });

    it('should receive arrivals:updated when parent posts location inside geofence', (done) => {
      const eventReceived: any[] = [];

      // Listen for arrivals:updated event
      clientSocket.on('arrivals:updated', (data) => {
        eventReceived.push(data);
      });

      // Give listener time to register, then POST location
      setTimeout(async () => {
        // Location inside geofence (300m away from school at -23.5505, -46.6333)
        await request(httpServer)
          .post('/locations')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            lat: -23.554,
            lng: -46.636,
            accuracy: 10,
          })
          .expect(200);

        // Wait for event to be received
        setTimeout(() => {
          try {
            expect(eventReceived.length).toBeGreaterThan(0);
            const event = eventReceived[0];
            expect(event).toHaveProperty('schoolId');
            expect(event.schoolId).toBe(testSchoolId);
            expect(event).toHaveProperty('arrivals');
            expect(Array.isArray(event.arrivals)).toBe(true);

            if (event.arrivals.length > 0) {
              const arrival = event.arrivals[0];
              expect(arrival).toHaveProperty('parentId');
              expect(arrival).toHaveProperty('parentName');
              expect(arrival).toHaveProperty('etaMinutes');
              expect(arrival).toHaveProperty('distanceMeters');
              expect(typeof arrival.etaMinutes).toBe('number');
              expect(arrival.etaMinutes).toBeGreaterThan(0);
            }

            done();
          } catch (error) {
            done(error);
          }
        }, 1500);
      }, 100);
    });

    it('should NOT receive arrivals:updated for location outside geofence', (done) => {
      const eventReceived: any[] = [];

      // Listen for arrivals:updated event
      clientSocket.on('arrivals:updated', (data) => {
        eventReceived.push(data);
      });

      // Give listener time to register, then POST location
      setTimeout(async () => {
        // Location outside geofence (5km away from school)
        await request(httpServer)
          .post('/locations')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            lat: -23.6005,
            lng: -46.6833,
            accuracy: 10,
          })
          .expect(200);

        // Wait and verify no event was received
        setTimeout(() => {
          try {
            expect(eventReceived.length).toBe(0);
            done();
          } catch (error) {
            done(error);
          }
        }, 2000);
      }, 100);
    });
  });
});
