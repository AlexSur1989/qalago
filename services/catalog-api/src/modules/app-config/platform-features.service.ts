import { Injectable } from '@nestjs/common';
import {
  PlatformFeatures,
  PlatformFeaturesResponseDto,
  type PlatformBusinessFeatureFlagKey,
} from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PLATFORM_BUSINESS_FEATURE_SAFE_DEFAULTS } from './feature-flag.defaults';
import { BusinessTeamDisabledException } from './business-team-disabled.exception';

@Injectable()
export class PlatformFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfigRevision(): Promise<number> {
    const settings = await this.prisma.appReleaseSettings.findUnique({
      where: { id: 'global' },
      select: { configRevision: true },
    });
    return settings?.configRevision ?? 1;
  }

  async readGlobalFlag(key: PlatformBusinessFeatureFlagKey): Promise<boolean> {
    const row = await this.prisma.featureFlagDefinition.findUnique({ where: { key } });
    if (!row) {
      return PLATFORM_BUSINESS_FEATURE_SAFE_DEFAULTS[key];
    }
    return row.globalEnabled;
  }

  async getPlatformFeatures(): Promise<PlatformFeaturesResponseDto> {
    const [businessTeamEnabled, configRevision] = await Promise.all([
      this.readGlobalFlag('businessTeamEnabled'),
      this.getConfigRevision(),
    ]);
    return {
      platformFeatures: { businessTeamEnabled },
      configRevision,
    };
  }

  async isBusinessTeamEnabled(): Promise<boolean> {
    return this.readGlobalFlag('businessTeamEnabled');
  }

  async assertBusinessTeamEnabled(): Promise<void> {
    if (!(await this.isBusinessTeamEnabled())) {
      throw new BusinessTeamDisabledException();
    }
  }
}
