import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Apply security middleware
  // Helmet sets various HTTP headers for security
  app.use(helmet());

  // Configure CORS with allowed origins from env
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`onMyWay API running on port ${port}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
