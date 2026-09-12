import { FeatureFlagKey } from '@qalago/shared-types';

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
];
