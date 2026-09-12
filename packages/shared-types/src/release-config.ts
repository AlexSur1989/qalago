export enum AppPlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export enum UpdateMode {
  NONE = 'NONE',
  OPTIONAL = 'OPTIONAL',
  REQUIRED = 'REQUIRED',
}

export enum QalagoEnvironment {
  LOCAL = 'LOCAL',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

/** Known feature flags — extend additively; unknown keys from API are ignored by older clients. */
export const FEATURE_FLAG_KEYS = [
  'reviewsEnabled',
  'promotionsEnabled',
  'favoritesEnabled',
  'mapEnabled',
  'searchEnabled',
  'adsEnabled',
  'adsPurchaseEnabled',
  'businessOnboardingEnabled',
  'analyticsEnabled',
  'googleAuthEnabled',
  'appleAuthEnabled',
  'subcategoriesEnabled',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export interface MobilePlatformConfigDto {
  minimumVersion: string;
  latestVersion: string;
  minimumBuild?: number | null;
  latestBuild?: number | null;
  updateMode: UpdateMode;
  storeUrl?: string | null;
}

export interface AppMaintenanceDto {
  enabled: boolean;
  messageRu?: string | null;
  messageKk?: string | null;
  endsAt?: string | null;
}

export interface AppConfigResponseDto {
  environment: QalagoEnvironment;
  configRevision: number;
  maintenance: AppMaintenanceDto;
  mobile: {
    android: MobilePlatformConfigDto;
    ios: MobilePlatformConfigDto;
  };
  featureFlags: Record<string, boolean>;
  cityLaunchStatus?: 'LIVE' | 'COMING_SOON' | null;
}

export interface ServiceVersionDto {
  service: string;
  version: string;
  commit?: string | null;
  environment: QalagoEnvironment;
}
