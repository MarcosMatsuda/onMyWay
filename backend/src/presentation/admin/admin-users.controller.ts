import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../infrastructure/auth/admin-jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/roles.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { CreateSchoolAdminUseCase } from '../../domain/use-cases/create-school-admin.use-case';
import { ListSchoolAdminsUseCase } from '../../domain/use-cases/list-school-admins.use-case';
import { DeleteAdminUserUseCase } from '../../domain/use-cases/delete-admin-user.use-case';
import { CreateSchoolAdminDto } from './dtos/create-school-admin.dto';

interface AdminUserResponseDto {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
  createdAt: Date;
}

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@ApiBearerAuth('admin-jwt')
export class AdminUsersController {
  constructor(
    private readonly createSchoolAdminUseCase: CreateSchoolAdminUseCase,
    private readonly listSchoolAdminsUseCase: ListSchoolAdminsUseCase,
    private readonly deleteAdminUserUseCase: DeleteAdminUserUseCase,
  ) {}

  @Post()
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  async createSchoolAdmin(
    @Body() dto: CreateSchoolAdminDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.createSchoolAdminUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      schoolId: dto.schoolId,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
    };
  }

  @Delete(':userId')
  @Roles('super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdminUser(@Param('userId') userId: string): Promise<void> {
    await this.deleteAdminUserUseCase.execute(userId);
  }
}
