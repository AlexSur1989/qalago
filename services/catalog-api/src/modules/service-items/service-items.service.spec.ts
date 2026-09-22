import { UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { MenuAccessService } from './menu-access.service';
import { ServiceItemsService } from './service-items.service';

describe('ServiceItemsService — multilingual PATCH (Stage 6.10B.6)', () => {
  const user = {
    sub: 'user-1',
    id: 'user-1',
    role: UserRole.BUSINESS,
  } as AuthUser;

  function createService() {
    const update = jest.fn().mockResolvedValue({
      id: 'item-1',
      businessId: 'b1',
      title: 'Primary title',
      titleKk: 'KK title',
      description: 'Primary desc',
      descriptionKk: null,
    });
    const findUnique = jest.fn().mockResolvedValue({
      id: 'item-1',
      businessId: 'b1',
      title: 'Primary title',
      titleKk: 'KK title',
      description: 'Primary desc',
      descriptionKk: null,
    });
    const tx = { serviceItem: { update } };
    const prisma = {
      serviceItem: { findUnique, update },
      serviceItemBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
    const menuAccess = {
      assertCanManage: jest.fn().mockResolvedValue(undefined),
    } as unknown as MenuAccessService;
    const planLimits = {} as PlanLimitsService;
    const auditLog = createMockAuditLog();
    const service = new ServiceItemsService(
      prisma,
      menuAccess,
      planLimits,
      asAuditLogService(auditLog),
    );
    return { service, update, menuAccess };
  }

  beforeEach(() => jest.clearAllMocks());

  it('updates titleKk without overwriting primary title', async () => {
    const { service, update } = createService();
    await service.update(user, 'item-1', { titleKk: 'Updated KK' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { titleKk: 'Updated KK' },
    });
  });

  it('updates title without touching titleKk when omitted', async () => {
    const { service, update } = createService();
    await service.update(user, 'item-1', { title: 'New primary' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { title: 'New primary' },
    });
    expect(update.mock.calls[0][0].data).not.toHaveProperty('titleKk');
  });

  it('normalizes empty optional KK fields to null', async () => {
    const { service, update } = createService();
    await service.update(user, 'item-1', {
      titleKk: '   ',
      descriptionKk: '',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { titleKk: null, descriptionKk: null },
    });
  });
});
