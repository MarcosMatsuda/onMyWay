import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, HealthService } from './health.controller';

@Module({
  imports: [TypeOrmModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
