import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { MenuAccessService } from './menu-access.service';
import { ServiceItemsService } from './service-items.service';

describe('ServiceItemsService — content access & plan limits (BIZ.5)', () => {
  const owner = { id: 'o1', sub: 'o1', role: UserRole.BUSINESS, phone: '+1' } as AuthUser;
  const manager = { id: 'm1', sub: 'm1', role: UserRole.USER, phone: '+2' } as AuthUser;

  function buildService(options?: {
    assertCanManage?: jest.Mock;
    assertCanAddServiceItem?: jest.Mock;
  }) {
    const create = jest.fn().mockResolvedValue({
      id: 'item-new',
      businessId: 'b1',
      title: 'Item',
    });
    const findUnique = jest.fn().mockResolvedValue({
      id: 'item-1',
      businessId: 'b1',
      title: 'Existing',
    });
    const update = jest.fn().mockResolvedValue({
      id: 'item-1',
      businessId: 'b1',
      title: 'Renamed',
    });
    const tx = {
      serviceItem: { create, update },
      serviceItemBranchAvailability: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    const prisma = {
      serviceItem: { findUnique, create, delete: jest.fn(), update: jest.fn() },
      serviceItemBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (fn: (c: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;

    const menuAccess = {
      assertCanManage: options?.assertCanManage ?? jest.fn().mockResolvedValue(undefined),
      assertGroupForBusiness: jest.fn(),
    } as unknown as MenuAccessService;

    const planLimits = {
      assertCanAddServiceItem:
        options?.assertCanAddServiceItem ?? jest.fn().mockResolvedValue(undefined),
    } as unknown as PlanLimitsService;

    const service = new ServiceItemsService(
      prisma,
      menuAccess,
      planLimits,
      asAuditLogService(createMockAuditLog()),
      { get: jest.fn().mockReturnValue('./uploads') } as never,
      { createReceipt: jest.fn(), assertValidReceipt: jest.fn() } as never,
    );
    return { service, menuAccess, planLimits, create, findUnique, prisma };
  }

  it('create enforces CATALOG_EDIT via menu access', async () => {
    const { service, menuAccess } = buildService();
    await service.create(owner, {
      businessId: 'b1',
      title: 'Coffee',
      price: 100,
    });
    expect(menuAccess.assertCanManage).toHaveBeenCalledWith(owner, 'b1');
  });

  it('create calls plan limit before insert', async () => {
    const assertCanAddServiceItem = jest.fn().mockResolvedValue(undefined);
    const { service, planLimits, create } = buildService({ assertCanAddServiceItem });
    await service.create(owner, { businessId: 'b1', title: 'Tea', price: 50 });
    expect(planLimits.assertCanAddServiceItem).toHaveBeenCalledWith('b1');
    expect(create).toHaveBeenCalled();
  });

  it('create blocked when plan limit exceeded', async () => {
    const { service } = buildService({
      assertCanAddServiceItem: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('limit')),
    });
    await expect(
      service.create(owner, { businessId: 'b1', title: 'X', price: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update at limit does not re-check create limit', async () => {
    const assertCanAddServiceItem = jest.fn().mockResolvedValue(undefined);
    const { service, planLimits } = buildService({ assertCanAddServiceItem });
    await service.update(owner, 'item-1', { title: 'Renamed' });
    expect(assertCanAddServiceItem).not.toHaveBeenCalled();
    expect(planLimits.assertCanAddServiceItem).not.toHaveBeenCalled();
  });

  it('update uses item.businessId for access (IDOR guard)', async () => {
    const assertCanManage = jest.fn().mockResolvedValue(undefined);
    const { service, menuAccess, findUnique } = buildService({ assertCanManage });
    findUnique.mockResolvedValue({ id: 'item-x', businessId: 'b-real', title: 'T' });
    await service.update(manager, 'item-x', { title: 'Hack' });
    expect(menuAccess.assertCanManage).toHaveBeenCalledWith(manager, 'b-real');
  });

  it('remove denies when menu access fails', async () => {
    const assertCanManage = jest
      .fn()
      .mockRejectedValue(new ForbiddenException('Insufficient permissions'));
    const { service } = buildService({ assertCanManage });
    await expect(service.remove(manager, 'item-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove missing item is NotFound', async () => {
    const { service, findUnique } = buildService();
    findUnique.mockResolvedValue(null);
    await expect(service.remove(owner, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MenuAccessService (BIZ.5)', () => {
  it('assertCanManage requires CATALOG_EDIT', async () => {
    const businessAccess = {
      assertBusinessPermission: jest.fn().mockResolvedValue(undefined),
    };
    const menuAccess = new MenuAccessService(
      businessAccess as never,
      { serviceMenuGroup: { findFirst: jest.fn() } } as never,
    );
    const user = { id: 'u1', sub: 'u1', role: UserRole.USER, phone: '+1' } as AuthUser;
    await menuAccess.assertCanManage(user, 'b1');
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      user,
      'b1',
      BusinessPermission.CATALOG_EDIT,
    );
  });
});
