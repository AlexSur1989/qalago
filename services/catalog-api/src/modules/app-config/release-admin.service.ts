import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AuditAction, AuditResourceType, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AppConfigService } from './app-config.service';
import { UpdateReleaseSettingsDto, UpsertCityFeatureFlagDto, UpsertFeatureFlagDto } from './dto/release-admin.dto';
import { isSuperAdmin } from '../../common/utils/system-access.util';

@Injectable()
export class ReleaseAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  assertSuperAdmin(user: AuthUser): void {
    if (!isSuperAdmin(user)) {
      throw new ForbiddenException();
    }
  }

  async updateReleaseSettings(user: AuthUser, dto: UpdateReleaseSettingsDto) {
    this.assertSuperAdmin(user);

    this.appConfig.validateReleaseSettings({
      androidMinimumVersion: dto.androidMinimumVersion,
      androidLatestVersion: dto.androidLatestVersion,
      androidMinimumBuild: dto.androidMinimumBuild,
      androidLatestBuild: dto.androidLatestBuild,
      iosMinimumVersion: dto.iosMinimumVersion,
      iosLatestVersion: dto.iosLatestVersion,
      iosMinimumBuild: dto.iosMinimumBuild,
      iosLatestBuild: dto.iosLatestBuild,
    });

    const existing = await this.prisma.appReleaseSettings.findUniqueOrThrow({
      where: { id: 'global' },
    });

    const updated = await this.prisma.appReleaseSettings.update({
      where: { id: 'global' },
      data: {
        maintenanceEnabled: dto.maintenanceEnabled ?? existing.maintenanceEnabled,
        maintenanceMessageRu: dto.maintenanceMessageRu ?? existing.maintenanceMessageRu,
        maintenanceMessageKk: dto.maintenanceMessageKk ?? existing.maintenanceMessageKk,
        maintenanceEndsAt: dto.maintenanceEndsAt ?? existing.maintenanceEndsAt,
        androidMinimumVersion: dto.androidMinimumVersion,
        androidLatestVersion: dto.androidLatestVersion,
        androidMinimumBuild: dto.androidMinimumBuild,
        androidLatestBuild: dto.androidLatestBuild,
        androidStoreUrl: dto.androidStoreUrl ?? existing.androidStoreUrl,
        iosMinimumVersion: dto.iosMinimumVersion,
        iosLatestVersion: dto.iosLatestVersion,
        iosMinimumBuild: dto.iosMinimumBuild,
        iosLatestBuild: dto.iosLatestBuild,
        iosStoreUrl: dto.iosStoreUrl ?? existing.iosStoreUrl,
        configRevision: { increment: 1 },
        updatedByUserId: user.id,
      },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.RELEASE_CONFIG_UPDATE,
      resourceType: AuditResourceType.APP_RELEASE_CONFIG,
      resourceId: 'global',
      metadata: {
        field: 'releaseSettings',
        previousRevision: existing.configRevision,
        newRevision: updated.configRevision,
      },
    });

    return updated;
  }

  async upsertGlobalFeatureFlag(user: AuthUser, dto: UpsertFeatureFlagDto) {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.featureFlagDefinition.findUnique({
      where: { key: dto.key },
    });

    const row = await this.prisma.featureFlagDefinition.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        globalEnabled: dto.globalEnabled,
        androidEnabled: dto.androidEnabled ?? null,
        iosEnabled: dto.iosEnabled ?? null,
        description: dto.description ?? null,
        updatedAt: new Date(),
      },
      update: {
        globalEnabled: dto.globalEnabled,
        androidEnabled: dto.androidEnabled ?? null,
        iosEnabled: dto.iosEnabled ?? null,
        description: dto.description ?? undefined,
        updatedAt: new Date(),
      },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.RELEASE_CONFIG_UPDATE,
      resourceType: AuditResourceType.APP_RELEASE_CONFIG,
      resourceId: dto.key,
      metadata: {
        field: 'featureFlag',
        key: dto.key,
        previousGlobal: existing?.globalEnabled ?? null,
        newGlobal: row.globalEnabled,
      },
    });

    return row;
  }

  async upsertCityFeatureFlag(user: AuthUser, cityId: string, dto: UpsertCityFeatureFlagDto) {
    if (user.role === UserRole.CITY_ADMIN) {
      const record = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { managedCityId: true },
      });
      if (record?.managedCityId !== cityId) {
        throw new ForbiddenException();
      }
    } else if (!isSuperAdmin(user) && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new BadRequestException('City not found');

    const row = await this.prisma.cityFeatureFlagOverride.upsert({
      where: { cityId_flagKey: { cityId, flagKey: dto.flagKey } },
      create: { cityId, flagKey: dto.flagKey, enabled: dto.enabled },
      update: { enabled: dto.enabled },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.RELEASE_CONFIG_UPDATE,
      resourceType: AuditResourceType.APP_RELEASE_CONFIG,
      resourceId: `${cityId}:${dto.flagKey}`,
      cityId,
      metadata: {
        field: 'cityFeatureFlag',
        flagKey: dto.flagKey,
        enabled: dto.enabled,
      },
    });

    return row;
  }
}
