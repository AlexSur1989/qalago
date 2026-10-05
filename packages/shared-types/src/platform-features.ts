/** Global Business Web product features (DB-backed, not city-scoped). BIZ.9 HOTFIX 5B. */
export const PLATFORM_BUSINESS_FEATURE_FLAG_KEYS = ['businessTeamEnabled'] as const;

export type PlatformBusinessFeatureFlagKey = (typeof PLATFORM_BUSINESS_FEATURE_FLAG_KEYS)[number];

/** Live in 5B — extend additively in later stages. */
export type PlatformFeatures = {
  businessTeamEnabled: boolean;
};

import type { MonetizationMode } from './monetization-mode';

export type PlatformFeaturesResponseDto = {
  platformFeatures: PlatformFeatures;
  configRevision: number;
  monetizationMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
};

export type PatchPlatformFeaturesDto = {
  businessTeamEnabled?: boolean;
  monetizationMode?: MonetizationMode;
};

export function isPlatformBusinessFeatureFlagKey(key: string): key is PlatformBusinessFeatureFlagKey {
  return (PLATFORM_BUSINESS_FEATURE_FLAG_KEYS as readonly string[]).includes(key);
}
