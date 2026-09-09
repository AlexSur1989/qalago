import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwt: { verifyAsync: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };

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
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwt as unknown as JwtService,
      { get: () => 'secret' } as unknown as ConfigService,
      prisma as never,
    );
  });

  it('rejects protected route without bearer token', async () => {
    const ctx = context();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches user from DB for valid token', async () => {
    const ctx = context('Bearer jwt-token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.user).toEqual({
      sub: 'u1',
      id: 'u1',
      role: UserRole.USER,
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
});
