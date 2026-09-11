import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue('access') };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'app.refreshTokenExpiresDays') return 30;
      if (key === 'app.jwtExpiresIn') return '20m';
      return undefined;
    }),
  };

  function createService(prisma: object) {
    return new AuthSessionService(
      prisma as never,
      jwt as never,
      config as never,
    );
  }

  it('rotates refresh token on valid refresh', async () => {
    const user = {
      id: 'u1',
      phone: '+77001234567',
      email: null,
      name: 'Test',
      role: UserRole.USER,
      isActive: true,
    };
    const sessions = new Map<string, object>();
    const prisma = {
      authSession: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          sessions.set(String(data.tokenHash), { ...data, id: 's1', user });
          return { id: 's1' };
        }),
        findUnique: jest.fn(async ({ where }: { where: { tokenHash: string } }) => {
          const row = sessions.get(where.tokenHash);
          if (!row) return null;
          return { ...(row as object), user };
        }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const service = createService(prisma);
    const issued = await service.issueQalaGoSession(user);
    const refreshed = await service.refreshSession(issued.refreshToken);
    expect(refreshed.accessToken).toBe('access');
    expect(refreshed.refreshToken).not.toBe(issued.refreshToken);
  });

  it('rejects replay of revoked refresh token', async () => {
    const user = {
      id: 'u1',
      phone: '+77001234567',
      email: null,
      name: 'Test',
      role: UserRole.USER,
      isActive: true,
    };
    const prisma = {
      authSession: {
        create: jest.fn(),
        findUnique: jest.fn(async () => ({
          id: 's1',
          userId: 'u1',
          familyId: 'fam1',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          user,
        })),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const service = createService(prisma);
    await expect(service.refreshSession('old-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.authSession.updateMany).toHaveBeenCalled();
  });
});
