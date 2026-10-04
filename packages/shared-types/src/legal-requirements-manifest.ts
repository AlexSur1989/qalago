/**
 * 6.15L.2 — centralized legal document requirements (not legal advice).
 * Publication status remains DRAFT until counsel/operator approval.
 */
import type { MandatoryPlatformLegalDocumentType } from './legal-published-manifest';

/** Content pack revision synced with docs/legal/* (not legally effective until published). */
export const LEGAL_PACK_CONTENT_VERSION = '2026-10-03-draft-1';

export const ALL_LEGAL_DOCUMENT_TYPES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'COMMUNITY_GUIDELINES',
  'BUSINESS_TERMS',
  'ADVERTISING_TERMS',
  'PERSONAL_DATA_CONSENT',
  'PUBLIC_OFFER',
] as const;

export type LegalDocumentTypeSlug = (typeof ALL_LEGAL_DOCUMENT_TYPES)[number];

export type LegalPublicPath =
  | '/terms'
  | '/privacy'
  | '/community'
  | '/personal-data-consent'
  | '/business-terms'
  | '/offer'
  | '/advertising-rules'
  | '/cookies';

export const LEGAL_DOCUMENT_PUBLIC_PATHS: Record<LegalDocumentTypeSlug, LegalPublicPath | null> = {
  TERMS_OF_SERVICE: '/terms',
  PRIVACY_POLICY: '/privacy',
  COMMUNITY_GUIDELINES: '/community',
  PERSONAL_DATA_CONSENT: '/personal-data-consent',
  BUSINESS_TERMS: '/business-terms',
  PUBLIC_OFFER: '/offer',
  ADVERTISING_TERMS: '/advertising-rules',
};

/** Cookie policy is informational only — no LegalDocumentType enum in 6.15L.2. */
export const LEGAL_COOKIES_PUBLIC_PATH = '/cookies' as const;

/**
 * Counsel decision deferred — when false, PD consent is optional at platform gate.
 * Enable via env LEGAL_REQUIRE_PERSONAL_DATA_CONSENT=true (backend reads mirror).
 */
export const DEFAULT_PERSONAL_DATA_CONSENT_MANDATORY = false;

export type LegalAudience = 'PUBLIC_USER' | 'BUSINESS_OWNER';

export type LegalRequirementContext =
  | 'PLATFORM_ACCESS'
  | 'BUSINESS_ACCESS'
  | 'PLAN_PURCHASE'
  | 'AD_PURCHASE'
  | 'BUSINESS_APPLICATION';

export function platformAccessDocumentTypes(options?: {
  personalDataConsentMandatory?: boolean;
  businessOwner?: boolean;
}): LegalDocumentTypeSlug[] {
  const types: LegalDocumentTypeSlug[] = [
    'TERMS_OF_SERVICE',
    'PRIVACY_POLICY',
  ];
  if (options?.personalDataConsentMandatory) {
    types.push('PERSONAL_DATA_CONSENT');
  }
  if (options?.businessOwner) {
    types.push('BUSINESS_TERMS');
  }
  return types;
}

export function checkoutPlanDocumentTypes(): LegalDocumentTypeSlug[] {
  return ['PUBLIC_OFFER'];
}

export function checkoutAdDocumentTypes(): LegalDocumentTypeSlug[] {
  return ['PUBLIC_OFFER', 'ADVERTISING_TERMS'];
}

export function businessApplicationDocumentTypes(): LegalDocumentTypeSlug[] {
  return ['BUSINESS_TERMS'];
}

export function isMandatoryPlatformType(
  type: string,
): type is MandatoryPlatformLegalDocumentType {
  return type === 'TERMS_OF_SERVICE' || type === 'PRIVACY_POLICY';
}
