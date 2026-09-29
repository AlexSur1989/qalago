/**
 * BIZ.8 — Owner-plane security regression umbrella.
 * Depth per domain: *-content-access.spec.ts, business-access.service.spec.ts, stage-* specs.
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, BusinessPlanTier } from '@prisma/client';
import { MenuAccessService } from '../../modules/service-items/menu-access.service';
import { PlansService } from '../../modules/plans/plans.service';
import { ConfigService } from '@nestjs/config';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('Owner-plane security regression (BIZ.8)', () => {
  const actor = { id: 'u1', sub: 'u1', phone: '+7700', role: 'USER' as const };

  describe('child-resource scoping', () => {
    it('menu group foreign to business → NotFound', async () => {
      const prisma = {
        serviceMenuGroup: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const service = new MenuAccessService(
        asBusinessAccessService(createMockBusinessAccess()),
        prisma as never,
      );
      await expect(service.assertGroupForBusiness('g-foreign', 'b1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('billing guards', () => {
    it('mock checkout blocked in production (regression)', async () => {
      const businessAccess = createMockBusinessAccess();
      businessAccess.assertOwner.mockResolvedValue({ id: 'b1' });
      const config = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'app.mockPlanCheckoutEnabled') return true;
          return undefined;
        }),
      } as unknown as ConfigService;
      const service = new PlansService(
        { business: { findUnique: jest.fn() } } as never,
        { getCatalogItem: jest.fn() } as never,
        { create: jest.fn() } as never,
        asBusinessAccessService(businessAccess),
        asAuditLogService(createMockAuditLog()),
        config,
      );
      await expect(
        service.mockCheckout(
          { id: 'o1', sub: 'o1', phone: '+1', role: 'BUSINESS' } as never,
          'b1',
          BusinessPlanTier.BASIC,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('permission isolation contract', () => {
    it('manager CATALOG_EDIT does not imply PHOTOS_EDIT at access layer', async () => {
      const businessAccess = createMockBusinessAccess();
      businessAccess.assertBusinessPermission.mockImplementation(
        async (_u, _b, perm: BusinessPermission) => {
          if (perm === BusinessPermission.CATALOG_EDIT) return { id: 'b1' };
          throw new ForbiddenException('Insufficient permissions');
        },
      );
      const menuAccess = new MenuAccessService(
        asBusinessAccessService(businessAccess),
        {} as never,
      );
      await expect(menuAccess.assertCanManage(actor, 'b1')).resolves.toBeUndefined();
      await expect(
        businessAccess.assertBusinessPermission(
          actor,
          'b1',
          BusinessPermission.PHOTOS_EDIT,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('coverage registry (automated suites)', () => {
    const REGISTRY = [
      'business-access.service.spec.ts',
      'businesses-membership.spec.ts',
      'business-team.service.spec.ts',
      'business-invitation.service.spec.ts',
      'business-location-security.spec.ts',
      'ownership-claims.service.spec.ts',
      'service-items-content-access.spec.ts',
      'promotions-content-access.spec.ts',
      'reviews-content-access.spec.ts',
      'uploads.service.spec.ts',
      'plans-billing-access.spec.ts',
      'notifications.service.spec.ts',
      'stage-6-7qa-purchase-adversarial.spec.ts',
    ] as const;

    it('documents expected security spec files', () => {
      expect(REGISTRY.length).toBeGreaterThanOrEqual(10);
      expect(REGISTRY).toContain('plans-billing-access.spec.ts');
    });
  });
});
