import { Injectable } from '@nestjs/common';
import { AppPlatform, FeatureFlagKey, FEATURE_FLAG_KEYS } from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { FEATURE_FLAG_SAFE_DEFAULTS } from './feature-flag.defaults';

type FlagRow = {
  key: string;
  globalEnabled: boolean;
  androidEnabled: boolean | null;
  iosEnabled: boolean | null;
};

type CityOverride = { flagKey: string; enabled: boolean };

@Injectable()
export class FeatureFlagResolverService {
  constructor(private readonly prisma: PrismaService) {}

  resolve(
    flags: FlagRow[],
    overrides: CityOverride[],
    platform: AppPlatform | undefined,
    cityId: string | undefined,
  ): Record<string, boolean> {
    const overrideMap = new Map(overrides.map((o) => [o.flagKey, o.enabled]));
    const out: Record<string, boolean> = {};

    for (const key of FEATURE_FLAG_KEYS) {
      const row = flags.find((f) => f.key === key);
      let value = row?.globalEnabled ?? FEATURE_FLAG_SAFE_DEFAULTS[key as FeatureFlagKey];

      if (platform === AppPlatform.ANDROID && row?.androidEnabled != null) {
        value = row.androidEnabled;
      }
      if (platform === AppPlatform.IOS && row?.iosEnabled != null) {
        value = row.iosEnabled;
      }

      if (cityId) {
        const cityOverride = overrideMap.get(key);
        if (cityOverride !== undefined) {
          value = cityOverride;
        }
      }

      out[key] = value;
    }

    return out;
  }

  async loadFlagsAndOverrides(citySlug?: string) {
    const [flags, city] = await Promise.all([
      this.prisma.featureFlagDefinition.findMany(),
      citySlug
        ? this.prisma.city.findUnique({
            where: { slug: citySlug },
            select: { id: true, launchStatus: true },
          })
        : Promise.resolve(null),
    ]);

    const overrides = city
      ? await this.prisma.cityFeatureFlagOverride.findMany({
          where: { cityId: city.id },
        })
      : [];

    return { flags, overrides, city };
  }
}
