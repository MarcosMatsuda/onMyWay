import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SchoolAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin has access to all schools
    if (user?.role === 'super_admin') {
      return true;
    }

    // School admin must have matching schoolId
    if (user?.role === 'school_admin') {
      const requestedSchoolId = request.params.schoolId;

      if (!requestedSchoolId) {
        throw new ForbiddenException('schoolId route param is required');
      }

      if (user.schoolId !== requestedSchoolId) {
        throw new ForbiddenException(
          'School admin can only access their own school',
        );
      }

      return true;
    }

    return false;
  }
}
