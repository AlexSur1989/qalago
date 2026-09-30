import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { PatchPlatformFeaturesDto, PlatformFeaturesResponseDto } from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isSuperAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlatformFeaturesService } from './platform-features.service';

@Injectable()
export class PlatformFeaturesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformFeatures: PlatformFeaturesService,
    private readonly auditLog: AuditLogService,
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

    if (dto.businessTeamEnabled === undefined) {
      return this.platformFeatures.getPlatformFeatures();
    }

    const existing = await this.prisma.featureFlagDefinition.findUnique({
      where: { key: 'businessTeamEnabled' },
    });
    const previousGlobal = existing?.globalEnabled ?? false;

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

    const settings = await this.prisma.appReleaseSettings.update({
      where: { id: 'global' },
      data: { configRevision: { increment: 1 }, updatedByUserId: user.id },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.RELEASE_CONFIG_UPDATE,
      resourceType: AuditResourceType.APP_RELEASE_CONFIG,
      resourceId: 'businessTeamEnabled',
      metadata: {
        field: 'platformFeature',
        key: 'businessTeamEnabled',
        previousGlobal,
        newGlobal: dto.businessTeamEnabled,
        newRevision: settings.configRevision,
      },
    });

    return {
      platformFeatures: { businessTeamEnabled: dto.businessTeamEnabled },
      configRevision: settings.configRevision,
    };
  }
}
