import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HomeSectionPlatform, HomeSectionType, UserRole } from '@prisma/client';
import {
  AdminHomeSectionRowDto,
  AdminHomeSectionsResponseDto,
  HOME_SECTION_TYPES,
  PublicHomeSectionDto,
} from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';

type ConfigRow = {
  id: string;
  sectionType: HomeSectionType;
  platform: HomeSectionPlatform;
  enabled: boolean;
  position: number;
  cityId: string | null;
};

@Injectable()
export class HomeSectionConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
  ) {}

  /**
   * Public resolution (CW.3):
   * 1. Load global rows (cityId null) + city-specific rows for requested city.
   * 2. City row overrides global row per sectionType.
   * 3. Drop disabled.
   * 4. Keep rows where platform is ALL or matches requested platform.
   * 5. Sort by position ascending.
   */
  async resolvePublicSections(
    citySlug: string,
    platform: HomeSectionPlatform,
  ): Promise<PublicHomeSectionDto[]> {
    const cityId = await this.cityScope.resolveCityId({ citySlug });
    const rows = await this.loadScopeRows(cityId);
    const effective = this.mergeEffective(rows.global, rows.city);

    return effective
      .filter((r) => r.enabled)
      .filter((r) => r.platform === HomeSectionPlatform.ALL || r.platform === platform)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        type: r.sectionType as unknown as import('@qalago/shared-types').HomeSectionType,
        enabled: r.enabled,
        position: r.position,
      }));
  }

  async listForAdmin(user: AuthUser, citySlug?: string): Promise<AdminHomeSectionsResponseDto> {
    if (user.role === UserRole.CITY_ADMIN) {
      const scopedCityId = await this.cityScope.resolveAdminCityId(user, citySlug);
      if (!scopedCityId) {
        throw new ForbiddenException('City admin must specify a city in scope');
      }
      const city = await this.prisma.city.findUnique({
        where: { id: scopedCityId },
        select: { id: true, slug: true },
      });
      if (!city) throw new NotFoundException('City not found');
      return this.buildAdminEffectiveView(city.slug, city.id);
    }

    if (citySlug) {
      const cityId = await this.cityScope.resolveCityId({ citySlug });
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
        select: { id: true, slug: true },
      });
      if (!city) throw new NotFoundException('City not found');
      return this.buildAdminEffectiveView(city.slug, city.id);
    }

    const globalRows = await this.prisma.homeSectionConfig.findMany({
      where: { cityId: null },
      orderBy: { position: 'asc' },
    });
    return {
      citySlug: null,
      cityId: null,
      sections: globalRows.map((r) => ({
        id: r.id,
        sectionType: r.sectionType as unknown as import('@qalago/shared-types').HomeSectionType,
        platform: r.platform as unknown as import('@qalago/shared-types').HomeSectionPlatform,
        enabled: r.enabled,
        position: r.position,
        scope: 'global' as const,
        inherited: false,
      })),
    };
  }

  async upsertForAdmin(user: AuthUser, dto: import('./dto/home-section.dto').UpsertHomeSectionDto) {
    this.assertKnownSectionType(dto.sectionType as unknown as HomeSectionType);

    let cityId: string | null = null;
    if (dto.citySlug) {
      cityId = await this.cityScope.resolveCityId({ citySlug: dto.citySlug });
      await this.assertCityWriteAccess(user, cityId);
    } else {
      await this.assertGlobalWriteAccess(user);
    }

    const sectionType = dto.sectionType as unknown as HomeSectionType;
    const platform = dto.platform as unknown as HomeSectionPlatform;

    const existing = await this.prisma.homeSectionConfig.findFirst({
      where: { cityId, sectionType },
    });
    if (existing) {
      return this.prisma.homeSectionConfig.update({
        where: { id: existing.id },
        data: {
          platform,
          enabled: dto.enabled,
          position: dto.position,
        },
      });
    }
    return this.prisma.homeSectionConfig.create({
      data: {
        sectionType,
        platform,
        enabled: dto.enabled,
        position: dto.position,
        cityId,
      },
    });
  }

  private async buildAdminEffectiveView(
    citySlug: string,
    cityId: string,
  ): Promise<AdminHomeSectionsResponseDto> {
    const { global, city } = await this.loadScopeRows(cityId);
    const cityByType = new Map(city.map((r) => [r.sectionType, r]));
    const globalByType = new Map(global.map((r) => [r.sectionType, r]));

    const sections: AdminHomeSectionRowDto[] = [];
    for (const sectionType of HOME_SECTION_TYPES) {
      const cityRow = cityByType.get(sectionType as unknown as HomeSectionType);
      const globalRow = globalByType.get(sectionType as unknown as HomeSectionType);
      const effective = cityRow ?? globalRow;
      if (!effective) continue;
      sections.push({
        id: cityRow?.id ?? globalRow?.id ?? null,
        sectionType: sectionType,
        platform: (effective.platform as unknown as import('@qalago/shared-types').HomeSectionPlatform),
        enabled: effective.enabled,
        position: effective.position,
        scope: cityRow ? 'city' : 'global',
        inherited: !cityRow && !!globalRow,
      });
    }
    sections.sort((a, b) => a.position - b.position);

    return { citySlug, cityId, sections };
  }

  private mergeEffective(global: ConfigRow[], city: ConfigRow[]): ConfigRow[] {
    const byType = new Map<HomeSectionType, ConfigRow>();
    for (const row of global) {
      byType.set(row.sectionType, row);
    }
    for (const row of city) {
      byType.set(row.sectionType, row);
    }
    return Array.from(byType.values());
  }

  private async loadScopeRows(cityId: string): Promise<{ global: ConfigRow[]; city: ConfigRow[] }> {
    const [global, city] = await Promise.all([
      this.prisma.homeSectionConfig.findMany({ where: { cityId: null } }),
      this.prisma.homeSectionConfig.findMany({ where: { cityId } }),
    ]);
    return { global, city };
  }

  private assertKnownSectionType(type: HomeSectionType) {
    if (!HOME_SECTION_TYPES.includes(type as unknown as import('@qalago/shared-types').HomeSectionType)) {
      throw new BadRequestException('Unknown home section type');
    }
  }

  private async assertGlobalWriteAccess(user: AuthUser) {
    if (user.role === UserRole.CITY_ADMIN) {
      throw new ForbiddenException('City admin cannot edit global home configuration');
    }
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
  }

  private async assertCityWriteAccess(user: AuthUser, cityId: string) {
    if (user.role === UserRole.CITY_ADMIN) {
      const allowed = await this.cityScope.getCityAdminScopeCityIds(user.id);
      if (!allowed.includes(cityId)) {
        throw new ForbiddenException('Not allowed to manage home config for this city');
      }
      return;
    }
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
  }
}
