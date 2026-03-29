import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no @Roles metadata is present', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'school_admin' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('allows access when user role matches required role', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'super_admin' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('allows access when user role is in required roles list', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'school_admin' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['super_admin', 'school_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('denies access when user role does not match required role', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'school_admin' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('denies access when user has no role', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'user-123' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('denies access when user is null', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('denies access when request has no user', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});
