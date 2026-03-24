import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';

/**
 * Create and initialize a test NestJS application
 * Connects to onmyway_test database (via .env.test)
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const testApp = moduleFixture.createNestApplication();
  await testApp.init();

  return testApp;
}

/**
 * Close the test application and clean up
 */
export async function closeTestApp(testApp: INestApplication): Promise<void> {
  if (testApp) {
    await testApp.close();
  }
}
