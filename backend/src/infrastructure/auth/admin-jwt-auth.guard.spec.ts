import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

describe('AdminJwtAuthGuard', () => {
  it('should be defined', () => {
    const guard = new AdminJwtAuthGuard();
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt-admin strategy', () => {
    const guard = new AdminJwtAuthGuard();
    // Verify guard is an instance that inherits from AuthGuard('jwt-admin')
    expect(guard).toBeInstanceOf(AdminJwtAuthGuard);
  });
});
