import { FeatureFlagKey, PlatformBusinessFeatureFlagKey } from '@qalago/shared-types';

/** Safe defaults when DB row missing — core browse stays ON; high-risk OFF. */
export const FEATURE_FLAG_SAFE_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  reviewsEnabled: true,
  promotionsEnabled: true,
  favoritesEnabled: true,
  mapEnabled: true,
  searchEnabled: true,
  adsEnabled: true,
  adsPurchaseEnabled: false,
  businessOnboardingEnabled: true,
  analyticsEnabled: true,
  googleAuthEnabled: false,
  appleAuthEnabled: false,
  subcategoriesEnabled: false,
  legalCenterEnabled: false,
  reportingEnabled: false,
  dataRightsEnabled: false,
  monetizationPurchasesEnabled: true,
  freeLaunchAccessEnabled: false,
};

export const FEATURE_FLAG_SEED: Array<{
  key: FeatureFlagKey;
  globalEnabled: boolean;
  description: string;
}> = [
  { key: 'reviewsEnabled', globalEnabled: true, description: 'Reviews read/write' },
  { key: 'promotionsEnabled', globalEnabled: true, description: 'Promotions discovery' },
  { key: 'favoritesEnabled', globalEnabled: true, description: 'Favorites' },
  { key: 'mapEnabled', globalEnabled: true, description: 'Map discovery' },
  { key: 'searchEnabled', globalEnabled: true, description: 'Search' },
  { key: 'adsEnabled', globalEnabled: true, description: 'Ad surfaces (display)' },
  { key: 'adsPurchaseEnabled', globalEnabled: false, description: 'Ad purchase checkout' },
  { key: 'businessOnboardingEnabled', globalEnabled: true, description: 'Business apply/claim' },
  { key: 'analyticsEnabled', globalEnabled: true, description: 'Owner analytics ingest' },
  { key: 'googleAuthEnabled', globalEnabled: false, description: 'Google sign-in (6.8D)' },
  { key: 'appleAuthEnabled', globalEnabled: false, description: 'Apple sign-in (6.8D)' },
  {
    key: 'subcategoriesEnabled',
    globalEnabled: false,
    description: 'Category subcategory chips and filters (6.8C.1)',
  },
  { key: 'legalCenterEnabled', globalEnabled: false, description: 'Legal center UI (6.9)' },
  { key: 'reportingEnabled', globalEnabled: false, description: 'Content reporting (6.9)' },
  { key: 'dataRightsEnabled', globalEnabled: false, description: 'Data rights requests (6.9)' },
  {
    key: 'monetizationPurchasesEnabled',
    globalEnabled: true,
    description: 'Plan and ad purchase checkout (NORMAL when true)',
  },
  {
    key: 'freeLaunchAccessEnabled',
    globalEnabled: false,
    description: 'Launch operational capability uplift when purchases disabled',
  },
];

/** Global Business Web product flags (not in mobile app-config resolver). */
export const PLATFORM_BUSINESS_FEATURE_SAFE_DEFAULTS: Record<
  PlatformBusinessFeatureFlagKey,
  boolean
> = {
  businessTeamEnabled: false,
};

export const PLATFORM_BUSINESS_FEATURE_SEED: Array<{
  key: PlatformBusinessFeatureFlagKey;
  globalEnabled: boolean;
  description: string;
}> = [
  {
    key: 'businessTeamEnabled',
    globalEnabled: false,
    description: 'Business Web owner team / manager management (BIZ.9 HOTFIX 5B)',
  },
];
