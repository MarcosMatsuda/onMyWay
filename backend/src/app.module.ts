import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { OSRMModule } from './infrastructure/osrm/osrm.module';
import { WebsocketModule } from './infrastructure/websocket/websocket.module';
import { LocationsModule } from './presentation/locations/locations.module';
import { SchoolsModule } from './presentation/schools/schools.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    OSRMModule,
    WebsocketModule,
    LocationsModule,
    SchoolsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
