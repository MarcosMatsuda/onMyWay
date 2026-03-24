import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { AppModule } from '../app.module';
import { ArrivalsGateway } from '../infrastructure/websocket/arrivals.gateway';
import { truncateTables, seedSchool } from './helpers';

describe('WebSocket/Arrivals Gateway (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testSchoolId: string;
  let serverUrl: string;
  let port: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the HTTP server to extract port
    const httpServer = app.getHttpServer();
    port = httpServer.address().port || 3000;
    serverUrl = `http://localhost:${port}`;

    const dataSource = app.get('DataSource');

    // Seed a test school
    const school = await seedSchool(dataSource);
    testSchoolId = school.id;

    // Register and login to get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'WebSocket Test User',
        email: 'websocket-test@example.com',
        password: 'WebSocketPass123',
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

  describe('Connection', () => {
    it('should connect with valid token', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: false,
      });

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          resolve();
        });

        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
      });

      expect(client.connected).toBe(true);
      client.disconnect();
    });

    it('should disconnect without token', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        transports: ['websocket'],
        reconnection: false,
      });

      let disconnected = false;

      await new Promise<void>((resolve) => {
        client.on('disconnect', () => {
          disconnected = true;
          resolve();
        });

        setTimeout(() => {
          resolve();
        }, 5000);
      });

      expect(disconnected).toBe(true);
    });

    it('should disconnect with invalid token', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        auth: { token: 'invalid.token.here' },
        transports: ['websocket'],
        reconnection: false,
      });

      let disconnected = false;

      await new Promise<void>((resolve) => {
        client.on('disconnect', () => {
          disconnected = true;
          resolve();
        });

        setTimeout(() => {
          resolve();
        }, 5000);
      });

      expect(disconnected).toBe(true);
    });
  });

  describe('school:join and school:leave', () => {
    it('should join a school room', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: false,
      });

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          client.emit('school:join', { schoolId: testSchoolId }, (response: any) => {
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.room).toBe(`school:${testSchoolId}`);
            resolve();
          });
        });

        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 5000);
      });

      client.disconnect();
    });

    it('should leave a school room', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: false,
      });

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          client.emit('school:join', { schoolId: testSchoolId }, () => {
            client.emit('school:leave', { schoolId: testSchoolId }, (response: any) => {
              expect(response).toBeDefined();
              expect(response.success).toBe(true);
              expect(response.room).toBe(`school:${testSchoolId}`);
              resolve();
            });
          });
        });

        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 5000);
      });

      client.disconnect();
    });
  });

  describe('arrivals:updated event', () => {
    it('should receive arrivals:updated when subscribed to school room', async () => {
      const client: ClientSocket = io(`${serverUrl}/ws`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: false,
      });

      const arrivals: any[] = [];

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          client.emit('school:join', { schoolId: testSchoolId }, () => {
            // Simulate server emitting arrivals update
            const arrivalsGateway = app.get(ArrivalsGateway);
            if (arrivalsGateway) {
              arrivalsGateway.emitArrivalsUpdated(testSchoolId, [], 'Test School');
            }
          });
        });

        client.on('arrivals:updated', (data: any) => {
          arrivals.push(data);
          expect(data).toBeDefined();
          expect(data.schoolId).toBe(testSchoolId);
          expect(data.schoolName).toBe('Test School');
          expect(Array.isArray(data.arrivals)).toBe(true);
          resolve();
        });

        setTimeout(() => {
          reject(new Error('No arrivals:updated event received'));
        }, 5000);
      });

      expect(arrivals.length).toBeGreaterThan(0);
      client.disconnect();
    });
  });
});
