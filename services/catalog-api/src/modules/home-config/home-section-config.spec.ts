import { ForbiddenException } from '@nestjs/common';
import { HomeSectionPlatform, HomeSectionType, UserRole } from '@prisma/client';
import {
  HomeSectionPlatform as SharedHomeSectionPlatform,
  HomeSectionType as SharedHomeSectionType,
  staffRoleHasPermission,
  StaffPermission,
} from '@qalago/shared-types';
import { HomeSectionConfigService } from './home-section-config.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('HomeSectionConfigService (CW.3)', () => {
  it('RBAC: HOME_CONFIG on staff roles', () => {
    expect(staffRoleHasPermission(UserRole.SUPER_ADMIN, StaffPermission.HOME_CONFIG_EDIT)).toBe(true);
    expect(staffRoleHasPermission(UserRole.ADMIN, StaffPermission.HOME_CONFIG_EDIT)).toBe(true);
    expect(staffRoleHasPermission(UserRole.CITY_ADMIN, StaffPermission.HOME_CONFIG_EDIT)).toBe(true);
    expect(staffRoleHasPermission(UserRole.BUSINESS, StaffPermission.HOME_CONFIG_VIEW)).toBe(false);
    expect(staffRoleHasPermission(UserRole.CONTENT_MANAGER, StaffPermission.HOME_CONFIG_EDIT)).toBe(
      false,
    );
  });

  const cityId = 'city-uralsk';
  const globalRows = [
    {
      id: 'g1',
      sectionType: HomeSectionType.HOME_VIP_BANNER,
      platform: HomeSectionPlatform.ALL,
      enabled: true,
      position: 10,
      cityId: null,
    },
    {
      id: 'g2',
      sectionType: HomeSectionType.CATEGORIES,
      platform: HomeSectionPlatform.ALL,
      enabled: true,
      position: 20,
      cityId: null,
    },
    {
      id: 'g3',
      sectionType: HomeSectionType.NEARBY,
      platform: HomeSectionPlatform.APP,
      enabled: true,
      position: 50,
      cityId: null,
    },
  ];

  type Row = {
    id: string;
    sectionType: HomeSectionType;
    platform: HomeSectionPlatform;
    enabled: boolean;
    position: number;
    cityId: string | null;
  };

  function createService(cityRows: Row[] = []) {
    const prisma = {
      homeSectionConfig: {
        findMany: jest.fn(async ({ where }: { where: { cityId: string | null } }) => {
          if (where.cityId === null) return globalRows;
          if (where.cityId === cityId) return cityRows;
          return [];
        }),
        findFirst: jest.fn(async () => null),
        create: jest.fn(async (args: unknown) => args),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const cityScope = {
      resolveCityId: jest.fn(async () => cityId),
      resolveAdminCityId: jest.fn(async () => cityId),
      getCityAdminScopeCityIds: jest.fn(async () => [cityId]),
    } as unknown as CityScopeService;

    const service = new HomeSectionConfigService(prisma, cityScope);
    return { service, prisma, cityScope };
  }

  it('resolves public sections: city override, platform filter, ordering', async () => {
    const cityRows = [
      {
        id: 'c1',
        sectionType: HomeSectionType.CATEGORIES,
        platform: HomeSectionPlatform.WEB,
        enabled: false,
        position: 5,
        cityId,
      },
    ];
    const { service } = createService(cityRows);

    const web = await service.resolvePublicSections('uralsk', HomeSectionPlatform.WEB);
    expect(web.map((s) => s.type)).toEqual(['HOME_VIP_BANNER']);

    const app = await service.resolvePublicSections('uralsk', HomeSectionPlatform.APP);
    expect(app.map((s) => s.type)).toEqual(['HOME_VIP_BANNER', 'NEARBY']);
  });

  it('city admin cannot edit global config', async () => {
    const { service } = createService();
    const user = { id: 'u1', role: UserRole.CITY_ADMIN } as AuthUser;
    await expect(
      service.upsertForAdmin(user, {
        sectionType: SharedHomeSectionType.CATEGORIES,
        enabled: true,
        position: 20,
        platform: SharedHomeSectionPlatform.ALL,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('city admin can upsert city-scoped row', async () => {
    const { service, prisma } = createService();
    const user = { id: 'u1', role: UserRole.CITY_ADMIN } as AuthUser;
    await service.upsertForAdmin(user, {
      sectionType: SharedHomeSectionType.CATEGORIES,
      citySlug: 'uralsk',
      enabled: true,
      position: 25,
      platform: SharedHomeSectionPlatform.ALL,
    });
    expect(prisma.homeSectionConfig.create).toHaveBeenCalled();
  });
});
