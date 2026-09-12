import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfigResponseDto,
  AppPlatform,
  MobilePlatformConfigDto,
  QalagoEnvironment,
  UpdateMode,
} from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveUpdateMode, assertReleaseVersionConfig } from '../../common/utils/update-mode.util';
import { FEATURE_FLAG_SEED } from './feature-flag.defaults';
import { FeatureFlagResolverService } from './feature-flag-resolver.service';

export type AppConfigQuery = {
  platform?: AppPlatform;
  appVersion?: string;
  buildNumber?: number;
  citySlug?: string;
};

@Injectable()
export class AppConfigService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly featureFlags: FeatureFlagResolverService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeeded();
  }

  getEnvironment(): QalagoEnvironment {
    const raw = this.config.get<string>('app.qalagoEnv', 'LOCAL');
    if (raw === QalagoEnvironment.STAGING) return QalagoEnvironment.STAGING;
    if (raw === QalagoEnvironment.PRODUCTION) return QalagoEnvironment.PRODUCTION;
    return QalagoEnvironment.LOCAL;
  }

  async ensureSeeded(): Promise<void> {
    await this.prisma.appReleaseSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', updatedAt: new Date() },
      update: {},
    });

    for (const flag of FEATURE_FLAG_SEED) {
      await this.prisma.featureFlagDefinition.upsert({
        where: { key: flag.key },
        create: {
          key: flag.key,
          globalEnabled: flag.globalEnabled,
          description: flag.description,
          updatedAt: new Date(),
        },
        update: {},
      });
    }
  }

  async isMaintenanceActive(): Promise<boolean> {
    const settings = await this.prisma.appReleaseSettings.findUnique({
      where: { id: 'global' },
    });
    if (!settings?.maintenanceEnabled) return false;
    if (settings.maintenanceEndsAt && settings.maintenanceEndsAt <= new Date()) {
      return false;
    }
    return true;
  }

  async getPublicConfig(query: AppConfigQuery): Promise<AppConfigResponseDto> {
    const settings = await this.prisma.appReleaseSettings.findUniqueOrThrow({
      where: { id: 'global' },
    });

    const { flags, overrides, city } = await this.featureFlags.loadFlagsAndOverrides(
      query.citySlug,
    );

    const platformFlags = this.featureFlags.resolve(
      flags,
      overrides,
      query.platform,
      city?.id,
    );

    const envGoogle = this.config.get<boolean>('app.googleAuthEnabled') === true;
    const envApple = this.config.get<boolean>('app.appleAuthEnabled') === true;
    platformFlags.googleAuthEnabled = platformFlags.googleAuthEnabled && envGoogle;
    platformFlags.appleAuthEnabled = platformFlags.appleAuthEnabled && envApple;

    const android = this.buildPlatformConfig(
      AppPlatform.ANDROID,
      settings.androidMinimumVersion,
      settings.androidLatestVersion,
      settings.androidMinimumBuild,
      settings.androidLatestBuild,
      settings.androidStoreUrl,
      query,
    );
    const ios = this.buildPlatformConfig(
      AppPlatform.IOS,
      settings.iosMinimumVersion,
      settings.iosLatestVersion,
      settings.iosMinimumBuild,
      settings.iosLatestBuild,
      settings.iosStoreUrl,
      query,
    );

    return {
      environment: this.getEnvironment(),
      configRevision: settings.configRevision,
      maintenance: {
        enabled: await this.isMaintenanceActive(),
        messageRu: settings.maintenanceMessageRu,
        messageKk: settings.maintenanceMessageKk,
        endsAt: settings.maintenanceEndsAt?.toISOString() ?? null,
      },
      mobile: { android, ios },
      featureFlags: platformFlags,
      cityLaunchStatus: city?.launchStatus ?? null,
    };
  }

  private buildPlatformConfig(
    platform: AppPlatform,
    minimumVersion: string,
    latestVersion: string,
    minimumBuild: number | null,
    latestBuild: number | null,
    storeUrl: string | null,
    query: AppConfigQuery,
  ): MobilePlatformConfigDto {
    let updateMode = UpdateMode.NONE;
    if (
      query.platform === platform &&
      query.appVersion &&
      query.appVersion.trim().length > 0
    ) {
      updateMode = resolveUpdateMode({
        appVersion: query.appVersion,
        buildNumber: query.buildNumber ?? null,
        minimumVersion,
        latestVersion,
        minimumBuild,
        latestBuild,
      });
    }

    return {
      minimumVersion,
      latestVersion,
      minimumBuild,
      latestBuild,
      updateMode,
      storeUrl,
    };
  }

  getServiceVersion() {
    return {
      service: 'catalog-api',
      version: this.config.get<string>('app.serviceVersion', '0.1.0'),
      commit: this.config.get<string>('app.gitCommit', '') || null,
      environment: this.getEnvironment(),
    };
  }

  validateReleaseSettings(input: {
    androidMinimumVersion: string;
    androidLatestVersion: string;
    androidMinimumBuild?: number | null;
    androidLatestBuild?: number | null;
    iosMinimumVersion: string;
    iosLatestVersion: string;
    iosMinimumBuild?: number | null;
    iosLatestBuild?: number | null;
  }): void {
    assertReleaseVersionConfig({
      minimumVersion: input.androidMinimumVersion,
      latestVersion: input.androidLatestVersion,
      minimumBuild: input.androidMinimumBuild,
      latestBuild: input.androidLatestBuild,
    });
    assertReleaseVersionConfig({
      minimumVersion: input.iosMinimumVersion,
      latestVersion: input.iosLatestVersion,
      minimumBuild: input.iosMinimumBuild,
      latestBuild: input.iosLatestBuild,
    });
  }
}
