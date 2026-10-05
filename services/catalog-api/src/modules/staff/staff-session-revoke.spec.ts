import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffAccessService } from './staff-access.service';

describe('individual staff session revocation', () => {
  function fixture() {
    const tx = { $queryRaw: jest.fn(), authSession: { updateMany: jest.fn() } };
    const prisma = {
      staffAccess: { findUnique: jest.fn().mockResolvedValue({}) },
      authSession: { findFirst: jest.fn().mockResolvedValue({ familyId: 'family' }) },
      $transaction: jest.fn(async fn => fn(tx)),
    };
    const service = new StaffAccessService(prisma as never, { assertPermission: jest.fn() } as never,
      {} as never, { record: jest.fn() } as never, {} as never);
    return { service, tx, prisma };
  }
  const actor = { id: 'admin', sub: 'admin', role: UserRole.SUPER_ADMIN };
  it('revokes successors too, under the same user lock as rotation', async () => {
    const { service, tx } = fixture();
    await service.revokeSession(actor, 'target', 'old-session');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'target', familyId: 'family', revokedAt: null },
    }));
  });
  it('cannot revoke a session belonging to a different target', async () => {
    const { service, tx, prisma } = fixture();
    prisma.authSession.findFirst.mockResolvedValue(null);
    await expect(service.revokeSession(actor, 'target', 'foreign')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.authSession.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign', userId: 'target' } });
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
  });
});
