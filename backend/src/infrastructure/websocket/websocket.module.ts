import { Module } from '@nestjs/common';
import { ArrivalsGateway } from './arrivals.gateway';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';
import { DataModule } from '../data/data.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DataModule, AuthModule],
  providers: [ArrivalsGateway, GetArrivalsQueueUseCase],
  exports: [ArrivalsGateway],
})
export class WebsocketModule {}
