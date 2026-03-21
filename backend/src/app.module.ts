import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { OSRMModule } from './infrastructure/osrm/osrm.module';
import { LocationsModule } from './presentation/locations/locations.module';
import { SchoolsModule } from './presentation/schools/schools.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    OSRMModule,
    LocationsModule,
    SchoolsModule,
    WebSocketModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
