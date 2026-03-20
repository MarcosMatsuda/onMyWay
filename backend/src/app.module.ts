import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { OSRMModule } from './infrastructure/osrm/osrm.module';

@Module({
  imports: [DatabaseModule, AuthModule, OSRMModule],
  controllers: [AppController],
})
export class AppModule {}
