import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
