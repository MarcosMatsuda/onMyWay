import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';

let testApp: INestApplication;

export async function createTestApp(): Promise<INestApplication> {
  if (testApp) {
    return testApp;
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  testApp = moduleFixture.createNestApplication();

  testApp.useGlobalPipes(new ValidationPipe());

  await testApp.init();

  return testApp;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
    testApp = null;
  }
}

export async function getTestAppInstance(): Promise<INestApplication> {
  return createTestApp();
}
