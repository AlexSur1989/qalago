import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffPermission, staffRoleHasPermission } from '@qalago/shared-types';
import { StaffAuthorizationGuard } from '../../common/guards/staff-authorization.guard';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { Reflector } from '@nestjs/core';
import { CityScopeService } from '../../common/services/city-scope.service';
import { ReportingScopeService } from './reporting-scope.service';
import { parseReportRange } from './reporting-range.util';
import { MAX_REPORT_RANGE_DAYS } from './reporting.constants';
import { aggregateSearchQueries, MIN_SEARCH_QUERY_DISPLAY_COUNT } from '../../common/utils/search-query-analytics.util';
import { CANONICAL_AD_PLACEMENT_CODES } from './reporting.constants';
import { BUSINESS_INTENT_ACTION_EVENT_TYPES } from '../../common/utils/analytics-intent-actions.util';
import { AnalyticsEventType } from '@prisma/client';

function mockReflector(permissions: StaffPermission[]) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'staff_permissions') return permissions;
      if (key === 'admin_staff_route') return true;
      return undefined;
    }),
  } as unknown as Reflector;
}

const ctx = (role: UserRole) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 'u1', sub: 'u1', role } }),
    }),
  }) as never;

describe('Stage 6.9.2 Admin reporting foundation', () => {
  const policy = new StaffPolicyService({} as never);
  const stepUp = new StaffStepUpService({ get: () => 600 } as never, { record: jest.fn() } as never);

  it('1. USER cannot access reports', () => {
    expect(staffRoleHasPermission(UserRole.USER, StaffPermission.REPORT_OVERVIEW_VIEW)).toBe(false);
  });

  it('3. SUPER_ADMIN has all report permissions', () => {
    expect(staffRoleHasPermission(UserRole.SUPER_ADMIN, StaffPermission.REPORT_SECURITY_VIEW)).toBe(
      true,
    );
    expect(staffRoleHasPermission(UserRole.SUPER_ADMIN, StaffPermission.REPORT_STAFF_VIEW)).toBe(
      true,
    );
  });

  it('4. ADMIN denied security report permission', () => {
    expect(staffRoleHasPermission(UserRole.ADMIN, StaffPermission.REPORT_SECURITY_VIEW)).toBe(false);
    expect(staffRoleHasPermission(UserRole.ADMIN, StaffPermission.REPORT_AUDIT_VIEW)).toBe(false);
  });

  it('5. MODERATOR denied finance', () => {
    expect(staffRoleHasPermission(UserRole.MODERATOR, StaffPermission.REPORT_FINANCE_VIEW)).toBe(
      false,
    );
  });

  it('6. MODERATOR can access moderation report', () => {
    expect(staffRoleHasPermission(UserRole.MODERATOR, StaffPermission.REPORT_MODERATION_VIEW)).toBe(
      true,
    );
  });

  it('7. SALES_MANAGER denied finance', () => {
    expect(staffRoleHasPermission(UserRole.SALES_MANAGER, StaffPermission.REPORT_FINANCE_VIEW)).toBe(
      false,
    );
  });

  it('8. CONTENT_MANAGER denied finance', () => {
    expect(staffRoleHasPermission(UserRole.CONTENT_MANAGER, StaffPermission.REPORT_FINANCE_VIEW)).toBe(
      false,
    );
  });

  it('9. FINANCE can view finance report', () => {
    expect(staffRoleHasPermission(UserRole.FINANCE, StaffPermission.REPORT_FINANCE_VIEW)).toBe(true);
  });

  it('10. FINANCE denied staff governance report', () => {
    expect(staffRoleHasPermission(UserRole.FINANCE, StaffPermission.REPORT_STAFF_VIEW)).toBe(false);
  });

  it('11. SUPPORT denied finance totals report', () => {
    expect(staffRoleHasPermission(UserRole.SUPPORT, StaffPermission.REPORT_FINANCE_VIEW)).toBe(false);
    expect(staffRoleHasPermission(UserRole.SUPPORT, StaffPermission.REPORT_SECURITY_VIEW)).toBe(false);
  });

  it('17. TECH_ADMIN can access system report', () => {
    expect(staffRoleHasPermission(UserRole.TECH_ADMIN, StaffPermission.REPORT_TECH_VIEW)).toBe(true);
  });

  it('18. TECH_ADMIN denied finance', () => {
    expect(staffRoleHasPermission(UserRole.TECH_ADMIN, StaffPermission.REPORT_FINANCE_VIEW)).toBe(
      false,
    );
  });

  it('15. ANALYST cannot access staff report', () => {
    expect(staffRoleHasPermission(UserRole.ANALYST, StaffPermission.REPORT_STAFF_VIEW)).toBe(false);
  });

  it('19. search privacy threshold preserved', () => {
    const result = aggregateSearchQueries([
      { searchQuery: 'a', count: MIN_SEARCH_QUERY_DISPLAY_COUNT - 1 },
      { searchQuery: 'pizza', count: 5 },
    ]);
    expect(result.queries.every((q) => q.count >= MIN_SEARCH_QUERY_DISPLAY_COUNT)).toBe(true);
  });

  it('20. canonical intent action set', () => {
    expect(BUSINESS_INTENT_ACTION_EVENT_TYPES).toContain(AnalyticsEventType.CALL_CLICK);
    expect(BUSINESS_INTENT_ACTION_EVENT_TYPES).not.toContain(AnalyticsEventType.FAVORITE_REMOVE);
  });

  it('21. ad report canonical placements', () => {
    expect(CANONICAL_AD_PLACEMENT_CODES).toEqual(
      expect.arrayContaining(['HOME_VIP_BANNER', 'CATEGORY_TOP', 'HOME_PROMOTIONS']),
    );
  });

  it('23. report range validation', () => {
    const to = new Date('2026-01-01T00:00:00Z');
    const from = new Date('2024-01-01T00:00:00Z');
    expect(() => parseReportRange(from.toISOString(), to.toISOString())).toThrow(
      BadRequestException,
    );
    const ok = parseReportRange('2026-01-01', '2026-01-15');
    expect(ok.fromMetricDate).toBe('2026-01-01');
    expect(MAX_REPORT_RANGE_DAYS).toBeGreaterThan(300);
  });

  describe('StaffAuthorizationGuard report routes', () => {
    it('27. staff oversight SUPER_ADMIN-only at permission level', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.REPORT_STAFF_VIEW]),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx(UserRole.ADMIN))).toThrow(ForbiddenException);
      expect(guard.canActivate(ctx(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('28. audit report SUPER_ADMIN-only permission', () => {
      expect(staffRoleHasPermission(UserRole.ADMIN, StaffPermission.REPORT_AUDIT_VIEW)).toBe(false);
    });

    it('24. export authorization', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.REPORT_EXPORT]),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx(UserRole.MODERATOR))).toThrow(ForbiddenException);
      expect(guard.canActivate(ctx(UserRole.ANALYST))).toBe(true);
    });
  });

  describe('CITY_ADMIN scope', () => {
    it('12–14. CITY_ADMIN city B forbidden via scope service', async () => {
      const prisma = {
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: 'city-a' }]),
        },
        user: { findUnique: jest.fn() },
        city: {
          findFirst: jest.fn().mockResolvedValue({ id: 'city-b', slug: 'city-b' }),
        },
        business: { findUnique: jest.fn() },
      };
      const cityScope = new CityScopeService(prisma as never, { get: () => 'uralsk' } as never);
      const reportingScope = new ReportingScopeService(prisma as never, cityScope);
      await expect(
        reportingScope.resolveScope(
          { id: 'ca', sub: 'ca', role: UserRole.CITY_ADMIN, phone: null },
          { citySlug: 'city-b' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('14b. businessId with no branch in city A rejected', async () => {
      const prisma = {
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: 'city-a' }]),
        },
        user: { findUnique: jest.fn() },
        city: { findFirst: jest.fn() },
        business: {
          findUnique: jest.fn().mockResolvedValue({ id: 'biz-b', cityId: 'city-b' }),
        },
        businessLocation: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const cityScope = new CityScopeService(prisma as never, { get: () => 'uralsk' } as never);
      const reportingScope = new ReportingScopeService(prisma as never, cityScope);
      await expect(
        reportingScope.resolveScope(
          { id: 'ca', sub: 'ca', role: UserRole.CITY_ADMIN, phone: null },
          { businessId: 'biz-b' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
