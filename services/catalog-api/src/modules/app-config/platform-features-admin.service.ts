import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '@prisma/client';
import {
  evaluateGooglePlayLaunchMonetizationGate,
  GooglePlayLaunchMonetizationGateDto,
  MonetizationMode,
  PatchPlatformFeaturesDto,
  PlatformFeaturesResponseDto,
} from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isSuperAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlatformFeaturesService } from './platform-features.service';
import { MonetizationModeService } from './monetization-mode.service';

@Injectable()
export class PlatformFeaturesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformFeatures: PlatformFeaturesService,
    private readonly auditLog: AuditLogService,
    private readonly monetizationMode: MonetizationModeService,
  ) {}

  assertSuperAdmin(user: AuthUser): void {
    if (!isSuperAdmin(user)) {
      throw new ForbiddenException();
    }
  }

  async getForAdmin(user: AuthUser): Promise<PlatformFeaturesResponseDto> {
    this.assertSuperAdmin(user);
    return this.platformFeatures.getPlatformFeatures();
  }

  async getReadOnly(user: AuthUser): Promise<PlatformFeaturesResponseDto> {
    if (user.role !== 'ADMIN' && !isSuperAdmin(user)) {
      throw new ForbiddenException();
    }
    return this.platformFeatures.getPlatformFeatures();
  }

  async patch(user: AuthUser, dto: PatchPlatformFeaturesDto): Promise<PlatformFeaturesResponseDto> {
    this.assertSuperAdmin(user);

    if (dto.businessTeamEnabled === undefined && dto.monetizationMode === undefined) {
      return this.platformFeatures.getPlatformFeatures();
    }

    let previousTeam: boolean | undefined;
    if (dto.businessTeamEnabled !== undefined) {
      const existing = await this.prisma.featureFlagDefinition.findUnique({
        where: { key: 'businessTeamEnabled' },
      });
      previousTeam = existing?.globalEnabled ?? false;

      await this.prisma.featureFlagDefinition.upsert({
        where: { key: 'businessTeamEnabled' },
        create: {
          key: 'businessTeamEnabled',
          globalEnabled: dto.businessTeamEnabled,
          updatedAt: new Date(),
        },
        update: {
          globalEnabled: dto.businessTeamEnabled,
          updatedAt: new Date(),
        },
      });
    }

    let previousMode: MonetizationMode | undefined;
    if (dto.monetizationMode !== undefined) {
      previousMode = await this.monetizationMode.getMode();
      await this.monetizationMode.applyMode(dto.monetizationMode);
    }

    const settings = await this.prisma.appReleaseSettings.update({
      where: { id: 'global' },
      data: { configRevision: { increment: 1 }, updatedByUserId: user.id },
    });

    if (dto.businessTeamEnabled !== undefined) {
      await this.auditLog.record({
        actor: user,
        action: AuditAction.RELEASE_CONFIG_UPDATE,
        resourceType: AuditResourceType.APP_RELEASE_CONFIG,
        resourceId: 'businessTeamEnabled',
        metadata: {
          field: 'platformFeature',
          key: 'businessTeamEnabled',
          previousGlobal: previousTeam,
          newGlobal: dto.businessTeamEnabled,
          newRevision: settings.configRevision,
        },
      });
    }

    if (dto.monetizationMode !== undefined) {
      await this.auditLog.record({
        actor: user,
        action: AuditAction.RELEASE_CONFIG_UPDATE,
        resourceType: AuditResourceType.APP_RELEASE_CONFIG,
        resourceId: 'monetizationMode',
        metadata: {
          field: 'monetizationMode',
          previousMode,
          newMode: dto.monetizationMode,
          newRevision: settings.configRevision,
        },
      });
    }

    return this.platformFeatures.getPlatformFeatures();
  }

  /** Operator release gate: first Google Play build expects LAUNCH (purchases off, launch uplift on). */
  async getGooglePlayLaunchCheck(): Promise<GooglePlayLaunchMonetizationGateDto> {
    const live = await this.platformFeatures.getPlatformFeatures();
    return evaluateGooglePlayLaunchMonetizationGate({
      monetizationMode: live.monetizationMode,
      canPurchasePlans: live.canPurchasePlans,
      canPurchaseAds: live.canPurchaseAds,
      launchAccessActive: live.launchAccessActive,
    });
  }
}
