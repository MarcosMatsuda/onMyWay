import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { DataModule } from '@data/data.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminSchoolsController } from './admin-schools.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from '@infrastructure/auth/admin-jwt.strategy';
import { parseJwtExpiresIn } from '@infrastructure/auth/jwt.constants';
import { ListSchoolsUseCase } from '@domain/use-cases/list-schools.use-case';
import { CreateSchoolUseCase } from '@domain/use-cases/create-school.use-case';
import { GetSchoolUseCase } from '@domain/use-cases/get-school.use-case';
import { GetSchoolInviteUseCase } from '@domain/use-cases/get-school-invite.use-case';
import { RegenerateSchoolInviteUseCase } from '@domain/use-cases/regenerate-school-invite.use-case';
import { ListSchoolParentsUseCase } from '@domain/use-cases/list-school-parents.use-case';
import { CreateSchoolAdminUseCase } from '@domain/use-cases/create-school-admin.use-case';
import { ListSchoolAdminsUseCase } from '@domain/use-cases/list-school-admins.use-case';
import { DeleteAdminUserUseCase } from '@domain/use-cases/delete-admin-user.use-case';
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
  controllers: [
    AdminAuthController,
    AdminSchoolsController,
    AdminUsersController,
  ],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    ListSchoolsUseCase,
    CreateSchoolUseCase,
    GetSchoolUseCase,
    GetSchoolInviteUseCase,
    RegenerateSchoolInviteUseCase,
    ListSchoolParentsUseCase,
    ListSchoolAdminsUseCase,
    CreateSchoolAdminUseCase,
    DeleteAdminUserUseCase,
    GetSchoolArrivalsUseCase,
    GetSchoolStatsUseCase,
    UpdateSchoolConfigUseCase,
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
