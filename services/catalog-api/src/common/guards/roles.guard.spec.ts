import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard (Stage 5M.2.1)', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  function contextFor(user?: { id: string; role: UserRole }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as never;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows USER when BUSINESS role is required (membership checked in service)', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([
      UserRole.BUSINESS,
      UserRole.ADMIN,
      UserRole.CITY_ADMIN,
    ]);

    expect(
      guard.canActivate(
        contextFor({ id: 'mgr', role: UserRole.USER }),
      ),
    ).toBe(true);
  });

  it('denies USER when only ADMIN is required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(contextFor({ id: 'u1', role: UserRole.USER })),
    ).toThrow(ForbiddenException);
  });

  it('allows BUSINESS when BUSINESS is required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([UserRole.BUSINESS]);

    expect(
      guard.canActivate(
        contextFor({ id: 'owner', role: UserRole.BUSINESS }),
      ),
    ).toBe(true);
  });

  it('passes through when no roles metadata', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    expect(guard.canActivate(contextFor({ id: 'u1', role: UserRole.USER }))).toBe(true);
  });
});
