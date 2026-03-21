import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
import { AllExceptionsFilter } from './infrastructure/filters/all-exceptions.filter';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Main');

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

  // Register global exception filters (in order of precedence)
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Register global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configure Swagger documentation (development only)
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('onMyWay API')
      .setDescription(
        'Real-time arrival notification API for schools and parents',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .addServer('http://localhost:3000', 'Local development')
      .addServer('http://localhost:5000', 'Local (Docker)')
      .addTag('auth', 'Authentication endpoints')
      .addTag('locations', 'Location tracking endpoints')
      .addTag('schools', 'School endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation available at /api/docs');
  }

  const port = configService.get<number>('PORT') || 3000;
  const logLevel = configService.get<string>('LOG_LEVEL') || 'info';

  await app.listen(port);
  logger.log(`onMyWay API running on port ${port}`);
  logger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  logger.log(`Log level: ${logLevel}`);
}

bootstrap();
