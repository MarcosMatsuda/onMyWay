import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ArrivalsGateway } from './arrivals.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [ArrivalsGateway],
  exports: [ArrivalsGateway],
})
export class WebSocketModule {}
