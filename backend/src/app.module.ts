import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { AdminModule } from './presentation/admin/admin.module';
import { OSRMModule } from './infrastructure/osrm/osrm.module';
import { LocationsModule } from './presentation/locations/locations.module';
import { SchoolsModule } from './presentation/schools/schools.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
import { HealthModule } from './presentation/health/health.module';
import { validationSchema } from './infrastructure/config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    // Global rate limiting: 100 requests per 60 seconds
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 100, ttl: 60000 }],
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    OSRMModule,
    LocationsModule,
    SchoolsModule,
    WebSocketModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
