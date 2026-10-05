import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService hardening', () => {
  const user = { id: 'u1', phone: null, email: null, name: 'Test', role: UserRole.SUPER_ADMIN, isActive: true };
  function fixture(overrides = {}) {
    const row = { id: 's1', userId: user.id, tokenHash: 'hash', familyId: 'family',
      revokedAt: null, expiresAt: new Date(Date.now() + 60_000), userAgent: null,
      mfaEnrollOnly: true, user, ...overrides };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: user.id }]),
      authSession: {
        findUnique: jest.fn().mockResolvedValue(row),
        create: jest.fn().mockImplementation(async ({ data }) => ({ ...data, id: 's2' })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      staffAccess: { findUnique: jest.fn().mockResolvedValue({ isActive: true, staffRole: user.role }) },
    };
    const prisma = { ...tx, $transaction: jest.fn(async (fn) => fn(tx)) };
    const jwt = { signAsync: jest.fn().mockImplementation(async payload => JSON.stringify(payload)) };
    const staff = { assertStaffSessionActive: jest.fn().mockResolvedValue({ mfaEnrollOnly: true }) };
    const service = new AuthSessionService(prisma as never, jwt as never,
      { get: (key: string, fallback: unknown) => key === 'app.jwtExpiresIn' ? '20m' : fallback } as never,
      staff as never);
    return { service, tx, prisma, jwt, staff, row };
  }

  it('persists enrollment restriction at issuance', async () => {
    const { service, tx } = fixture();
    const issued = await service.issueQalaGoSession(user, { mfaEnrollOnly: true });
    expect(JSON.parse(issued.accessToken).mfaEnrollOnly).toBe(true);
    expect(tx.authSession.create.mock.calls[0][0].data.mfaEnrollOnly).toBe(true);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('preserves restriction through refresh and does not preserve step-up', async () => {
    const { service, tx } = fixture();
    const refreshed = await service.refreshSession('old');
    expect(JSON.parse(refreshed.accessToken)).toMatchObject({ mfaEnrollOnly: true, sid: 's2' });
    expect(JSON.parse(refreshed.accessToken).stepUpAt).toBeUndefined();
    expect(tx.authSession.updateMany.mock.calls[0][0].where).toMatchObject({ id: 's1', revokedAt: null });
    expect(tx.authSession.create.mock.calls[0][0].data).toMatchObject({ familyId: 'family', rotatedFromId: 's1', mfaEnrollOnly: true });
  });

  it('rotates full sessions without adding enrollment restriction', async () => {
    const { service } = fixture({ mfaEnrollOnly: false });
    expect(JSON.parse((await service.refreshSession('old')).accessToken).mfaEnrollOnly).toBeUndefined();
  });

  it('commits family revocation before rejecting a replay', async () => {
    const { service, tx, prisma } = fixture({ revokedAt: new Date() });
    await expect(service.refreshSession('old')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(await prisma.$transaction.mock.results[0].value).toBeNull();
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { familyId: 'family', revokedAt: null } }));
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it.each([
    { expiresAt: new Date(0) },
    { user: { ...user, isActive: false } },
  ])('rejects expired or inactive session: %j', async (overrides) => {
    const { service, tx } = fixture(overrides);
    await expect(service.refreshSession('old')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('rejects disabled staff and commits family revocation', async () => {
    const { service, tx } = fixture();
    tx.staffAccess.findUnique.mockResolvedValue(null);
    await expect(service.refreshSession('old')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.authSession.updateMany).toHaveBeenCalled();
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('does not create a successor when conditional consume fails', async () => {
    const { service, tx } = fixture();
    tx.authSession.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.refreshSession('old')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('cannot use step-up or token reissue to remove restriction', async () => {
    const { service, jwt } = fixture();
    await expect(service.issueStepUpAccessToken(user, 's1', 100)).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
    expect(JSON.parse(await service.reissueStaffAccessToken(user, 's1')).mfaEnrollOnly).toBe(true);
  });

  it('logs out the whole family even using an old rotated token', async () => {
    const { service, tx } = fixture({ revokedAt: new Date() });
    await service.revokeRefreshToken('old');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { familyId: 'family', revokedAt: null } }));
  });

  it('serializes logout-all with rotation', async () => {
    const { service, tx } = fixture();
    await service.revokeAllUserSessions(user.id);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }));
  });
});
