import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { DataModule } from '@data/data.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminSchoolsController } from './admin-schools.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from '@infrastructure/auth/admin-jwt.strategy';
import { parseJwtExpiresIn } from '@infrastructure/auth/jwt.constants';
import { ListSchoolsUseCase } from '@domain/use-cases/list-schools.use-case';
import { CreateSchoolUseCase } from '@domain/use-cases/create-school.use-case';
import { GetSchoolUseCase } from '@domain/use-cases/get-school.use-case';
import { GetSchoolInviteUseCase } from '@domain/use-cases/get-school-invite.use-case';
import { RegenerateSchoolInviteUseCase } from '@domain/use-cases/regenerate-school-invite.use-case';
import { GetSchoolArrivalsUseCase } from '@domain/use-cases/get-school-arrivals.use-case';
import { GetSchoolStatsUseCase } from '@domain/use-cases/get-school-stats.use-case';
import { UpdateSchoolConfigUseCase } from '@domain/use-cases/update-school-config.use-case';

@Module({
  imports: [
    DataModule,
    PassportModule.register({ defaultStrategy: 'jwt-admin' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseJwtExpiresIn(
            configService.get<string>('JWT_EXPIRES_IN'),
          ),
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminSchoolsController],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    ListSchoolsUseCase,
    CreateSchoolUseCase,
    GetSchoolUseCase,
    GetSchoolInviteUseCase,
    RegenerateSchoolInviteUseCase,
    GetSchoolArrivalsUseCase,
    GetSchoolStatsUseCase,
    UpdateSchoolConfigUseCase,
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
