import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AppPlatform, UpdateMode } from '@qalago/shared-types';
import { FeatureFlagResolverService } from './feature-flag-resolver.service';
import { ReleaseAdminService } from './release-admin.service';
import { AppConfigService } from './app-config.service';
import { FEATURE_FLAG_SAFE_DEFAULTS } from './feature-flag.defaults';

describe('Stage 6.8C release architecture', () => {
  describe('FeatureFlagResolverService', () => {
    const resolver = new FeatureFlagResolverService({} as never);

    it('O: global default', () => {
      const flags = [{ key: 'adsPurchaseEnabled', globalEnabled: false, androidEnabled: null, iosEnabled: null }];
      const out = resolver.resolve(flags, [], undefined, undefined);
      expect(out.adsPurchaseEnabled).toBe(false);
    });

    it('P/Q: city override and new city inherits global', () => {
      const flags = [{ key: 'mapEnabled', globalEnabled: true, androidEnabled: null, iosEnabled: null }];
      const uralsk = resolver.resolve(flags, [{ flagKey: 'mapEnabled', enabled: false }], undefined, 'city-1');
      const aktobe = resolver.resolve(flags, [], undefined, 'city-2');
      expect(uralsk.mapEnabled).toBe(false);
      expect(aktobe.mapEnabled).toBe(true);
    });

    it('R: city override isolated', () => {
      const flags = [{ key: 'searchEnabled', globalEnabled: true, androidEnabled: null, iosEnabled: null }];
      const a = resolver.resolve(flags, [{ flagKey: 'searchEnabled', enabled: false }], undefined, 'c1');
      const b = resolver.resolve(flags, [], undefined, 'c2');
      expect(a.searchEnabled).toBe(false);
      expect(b.searchEnabled).toBe(true);
    });

    it('S/T: unknown flag omitted; auth flags default safe', () => {
      const out = resolver.resolve([], [], undefined, undefined);
      expect(out.googleAuthEnabled).toBe(FEATURE_FLAG_SAFE_DEFAULTS.googleAuthEnabled);
      expect(out.appleAuthEnabled).toBe(FEATURE_FLAG_SAFE_DEFAULTS.appleAuthEnabled);
      expect(out).not.toHaveProperty('unknownFlag');
    });
  });

  describe('ReleaseAdminService authorization', () => {
    it('V/W: business user cannot mutate release settings', async () => {
      const service = new ReleaseAdminService({} as never, {} as never, {} as never);
      expect(() =>
        service.assertSuperAdmin({ id: 'u', sub: 'u', role: UserRole.BUSINESS, phone: '+1' }),
      ).toThrow(ForbiddenException);
    });

    it('X: CITY_ADMIN cannot use super-admin assert', async () => {
      const service = new ReleaseAdminService({} as never, {} as never, {} as never);
      expect(() =>
        service.assertSuperAdmin({ id: 'u', sub: 'u', role: UserRole.CITY_ADMIN, phone: '+1' }),
      ).toThrow(ForbiddenException);
    });
  });

  describe('AppConfigService update decision exposure', () => {
    it('AL: old client below minimum resolves REQUIRED in platform block', async () => {
      const prisma = {
        appReleaseSettings: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            configRevision: 1,
            maintenanceEnabled: false,
            maintenanceMessageRu: null,
            maintenanceMessageKk: null,
            maintenanceEndsAt: null,
            androidMinimumVersion: '1.1.0',
            androidLatestVersion: '1.2.0',
            androidMinimumBuild: null,
            androidLatestBuild: null,
            androidStoreUrl: null,
            iosMinimumVersion: '1.0.0',
            iosLatestVersion: '1.0.0',
            iosMinimumBuild: null,
            iosLatestBuild: null,
            iosStoreUrl: null,
          }),
        },
        featureFlagDefinition: { findMany: jest.fn().mockResolvedValue([]) },
        city: { findUnique: jest.fn().mockResolvedValue(null) },
        cityFeatureFlagOverride: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const config = {
        get: jest.fn((key: string) => {
          if (key === 'app.qalagoEnv') return 'LOCAL';
          if (key === 'app.googleAuthEnabled') return false;
          if (key === 'app.appleAuthEnabled') return false;
          return undefined;
        }),
      };
      const featureFlags = {
        loadFlagsAndOverrides: jest.fn().mockResolvedValue({ flags: [], overrides: [], city: null }),
        resolve: jest.fn().mockReturnValue(FEATURE_FLAG_SAFE_DEFAULTS),
      };
      const service = new AppConfigService(
        prisma as never,
        config as never,
        featureFlags as never,
      );
      jest.spyOn(service, 'isMaintenanceActive').mockResolvedValue(false);

      const dto = await service.getPublicConfig({
        platform: AppPlatform.ANDROID,
        appVersion: '1.0.0',
        buildNumber: 1,
      });
      expect(dto.mobile.android.updateMode).toBe(UpdateMode.REQUIRED);
    });
  });
});
