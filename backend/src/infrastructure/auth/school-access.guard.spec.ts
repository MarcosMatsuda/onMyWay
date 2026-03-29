import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SchoolAccessGuard } from './school-access.guard';

describe('SchoolAccessGuard', () => {
  let guard: SchoolAccessGuard;

  beforeEach(() => {
    guard = new SchoolAccessGuard();
  });

  it('allows super_admin to access any school', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'super_admin', schoolId: null },
          params: { schoolId: 'school-999' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('allows school_admin to access their own school', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'school_admin', schoolId: 'school-123' },
          params: { schoolId: 'school-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('denies school_admin from accessing other schools', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'school_admin', schoolId: 'school-123' },
          params: { schoolId: 'school-456' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when schoolId param is missing', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'school_admin', schoolId: 'school-123' },
          params: {},
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies access for users with no role', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-123' },
          params: { schoolId: 'school-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('denies access when user is null', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: null,
          params: { schoolId: 'school-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('denies access when request has no user', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          params: { schoolId: 'school-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('throws ForbiddenException with descriptive message for mismatched schoolId', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'school_admin', schoolId: 'school-123' },
          params: { schoolId: 'school-999' },
        }),
      }),
    } as unknown as ExecutionContext;

    try {
      guard.canActivate(context);
      fail('Should have thrown ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(error.message).toContain(
        'School admin can only access their own school',
      );
    }
  });
});
