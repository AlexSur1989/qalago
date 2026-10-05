import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ALLOW_MFA_ENROLLMENT_KEY } from '../decorators/allow-mfa-enrollment.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwt: { verifyAsync: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };
  let staffSession: {
    assertStaffAccessActive: jest.Mock;
    assertStaffSessionActive: jest.Mock;
  };

  const context = (authHeader?: string) => {
    const request: {
      headers: { authorization?: string };
      user?: unknown;
    } = { headers: {} };
    if (authHeader) {
      request.headers.authorization = authHeader;
    }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
      request,
    } as unknown as ExecutionContext & { request: typeof request };
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', role: UserRole.USER }) };
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          phone: null,
          role: UserRole.USER,
          isActive: true,
        }),
      },
    };
    staffSession = {
      assertStaffAccessActive: jest.fn(),
      assertStaffSessionActive: jest.fn(),
    };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwt as unknown as JwtService,
      { get: () => 'secret' } as unknown as ConfigService,
      prisma as never,
      staffSession as never,
    );
  });

  it('rejects protected route without bearer token', async () => {
    const ctx = context();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches user from DB for valid token', async () => {
    const ctx = context('Bearer jwt-token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.user).toMatchObject({
      sub: 'u1',
      id: 'u1',
      role: UserRole.USER,
      mfaEnrollOnly: false,
    });
  });

  it('rejects inactive user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+7700',
      role: UserRole.USER,
      isActive: false,
    });
    const ctx = context('Bearer jwt-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow('User inactive');
  });

  it('allows public route without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = context();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('ignores invalid token on public route', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    jwt.verifyAsync.mockRejectedValue(new Error('invalid'));
    const ctx = context('Bearer bad');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.user).toBeUndefined();
  });

  function restrictedStaff() {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.SUPER_ADMIN, isActive: true });
    staffSession.assertStaffAccessActive.mockResolvedValue(UserRole.SUPER_ADMIN);
    staffSession.assertStaffSessionActive.mockResolvedValue({ mfaEnrollOnly: true });
    // Even an old JWT missing the restriction cannot override the database.
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', sid: 's1' });
  }

  it('blocks persisted limited session on an unannotated authenticated route', async () => {
    restrictedStaff();
    await expect(guard.canActivate(context('Bearer jwt'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only explicitly marked enrollment/bootstrap routes', async () => {
    restrictedStaff();
    reflector.getAllAndOverride.mockImplementation(key => key === ALLOW_MFA_ENROLLMENT_KEY);
    const ctx = context('Bearer jwt');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.user).toMatchObject({ mfaEnrollOnly: true });
  });

  it('treats limited bearer as guest on a public route', async () => {
    restrictedStaff();
    reflector.getAllAndOverride.mockImplementation(key => key === IS_PUBLIC_KEY);
    const ctx = context('Bearer jwt');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.user).toBeUndefined();
  });

  it('keeps old limited JWT restricted after persisted promotion', async () => {
    restrictedStaff();
    staffSession.assertStaffSessionActive.mockResolvedValue({ mfaEnrollOnly: false });
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', sid: 's1', mfaEnrollOnly: true });
    await expect(guard.canActivate(context('Bearer jwt'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects revoked staff session before allowing enrollment', async () => {
    restrictedStaff();
    reflector.getAllAndOverride.mockImplementation(key => key === ALLOW_MFA_ENROLLMENT_KEY);
    staffSession.assertStaffSessionActive.mockRejectedValue(new UnauthorizedException());
    await expect(guard.canActivate(context('Bearer jwt'))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
