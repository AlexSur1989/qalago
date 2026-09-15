import { PromotionStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { PromotionsService } from './promotions.service';

describe('PromotionsService — multilingual PATCH (Stage 6.10B.6)', () => {
  const user = {
    sub: 'user-1',
    id: 'user-1',
    role: UserRole.BUSINESS,
  } as AuthUser;

  function createService() {
    const update = jest.fn().mockResolvedValue({});
    const findUnique = jest.fn().mockResolvedValue({
      id: 'promo-1',
      businessId: 'b1',
      title: 'Primary promo',
      titleKk: 'KK promo',
      description: 'Primary desc',
      descriptionKk: null,
      status: PromotionStatus.DRAFT,
      startDate: null,
      endDate: null,
    });
    const prisma = {
      promotion: { findUnique, update },
    } as unknown as PrismaService;
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        limits: { maxPromotionDurationDays: 30 },
      }),
      resolvePromotionDates: jest.fn(),
    } as unknown as PlanLimitsService;
    const businessAccess = {
      assertBusinessPermission: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessAccessService;
    const auditLog = createMockAuditLog();
    const service = new PromotionsService(
      prisma,
      {} as CityScopeService,
      planLimits,
      businessAccess,
      asAuditLogService(auditLog),
    );
    return { service, update, businessAccess };
  }

  beforeEach(() => jest.clearAllMocks());

  it('updates titleKk without overwriting primary title', async () => {
    const { service, update } = createService();
    await service.update(user, 'promo-1', { titleKk: 'Updated KK' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'promo-1' },
        data: expect.objectContaining({ titleKk: 'Updated KK' }),
      }),
    );
    expect(update.mock.calls[0][0].data).not.toHaveProperty('title');
  });

  it('updates title without touching titleKk when omitted', async () => {
    const { service, update } = createService();
    await service.update(user, 'promo-1', { title: 'New primary' });
    expect(update.mock.calls[0][0].data).toEqual(
      expect.objectContaining({ title: 'New primary' }),
    );
    expect(update.mock.calls[0][0].data).not.toHaveProperty('titleKk');
  });

  it('normalizes empty optional KK fields to null', async () => {
    const { service, update } = createService();
    await service.update(user, 'promo-1', {
      titleKk: '  ',
      descriptionKk: '',
    });
    expect(update.mock.calls[0][0].data).toEqual(
      expect.objectContaining({ titleKk: null, descriptionKk: null }),
    );
  });
});
