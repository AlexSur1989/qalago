import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PlatformFeaturesService } from './platform-features.service';
import { PlatformFeaturesAdminService } from './platform-features-admin.service';
import { ReleaseAdminService } from './release-admin.service';
import { BusinessTeamDisabledException, BUSINESS_TEAM_DISABLED_CODE } from './business-team-disabled.exception';

describe('PlatformFeaturesService (BIZ.9 HOTFIX 5B)', () => {
  it('defaults businessTeamEnabled to false when row missing', async () => {
    const prisma = {
      featureFlagDefinition: { findUnique: jest.fn().mockResolvedValue(null) },
      appReleaseSettings: { findUnique: jest.fn().mockResolvedValue({ configRevision: 3 }) },
    };
    const service = new PlatformFeaturesService(prisma as never);
    await expect(service.isBusinessTeamEnabled()).resolves.toBe(false);
    const dto = await service.getPlatformFeatures();
    expect(dto.platformFeatures.businessTeamEnabled).toBe(false);
    expect(dto.configRevision).toBe(3);
  });

  it('assertBusinessTeamEnabled throws BUSINESS_TEAM_DISABLED', async () => {
    const prisma = {
      featureFlagDefinition: { findUnique: jest.fn().mockResolvedValue({ globalEnabled: false }) },
    };
    const service = new PlatformFeaturesService(prisma as never);
    await expect(service.assertBusinessTeamEnabled()).rejects.toMatchObject({
      response: { code: BUSINESS_TEAM_DISABLED_CODE },
    });
  });
});

describe('PlatformFeaturesAdminService (BIZ.9 HOTFIX 5B)', () => {
  const superAdmin = { id: 'sa', role: UserRole.SUPER_ADMIN, sub: 'sa' };
  const admin = { id: 'a1', role: UserRole.ADMIN, sub: 'a1' };

  it('PATCH requires SUPER_ADMIN', async () => {
    const adminService = new PlatformFeaturesAdminService({} as never, {} as never, {} as never);
    await expect(
      adminService.patch(admin as never, { businessTeamEnabled: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ReleaseAdminService city override (BIZ.9 HOTFIX 5B)', () => {
  it('rejects city override for businessTeamEnabled', async () => {
    const releaseAdmin = new ReleaseAdminService({} as never, {} as never, {} as never);
    await expect(
      releaseAdmin.upsertCityFeatureFlag(
        { id: 'sa', role: UserRole.SUPER_ADMIN, sub: 'sa' } as never,
        'city-1',
        { flagKey: 'businessTeamEnabled', enabled: true } as never,
      ),
    ).rejects.toThrow('City override is not allowed');
  });
});
