/** Global Business Web product features (DB-backed, not city-scoped). BIZ.9 HOTFIX 5B. */
export const PLATFORM_BUSINESS_FEATURE_FLAG_KEYS = ['businessTeamEnabled'] as const;

export type PlatformBusinessFeatureFlagKey = (typeof PLATFORM_BUSINESS_FEATURE_FLAG_KEYS)[number];

/** Live in 5B — extend additively in later stages. */
export type PlatformFeatures = {
  businessTeamEnabled: boolean;
};

export type PlatformFeaturesResponseDto = {
  platformFeatures: PlatformFeatures;
  configRevision: number;
};

export type PatchPlatformFeaturesDto = {
  businessTeamEnabled?: boolean;
};

export function isPlatformBusinessFeatureFlagKey(key: string): key is PlatformBusinessFeatureFlagKey {
  return (PLATFORM_BUSINESS_FEATURE_FLAG_KEYS as readonly string[]).includes(key);
}
