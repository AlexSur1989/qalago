import { getPublicSiteBaseUrl } from './public-config';
import { publicLegalPath, type PublicLegalRootSegment } from './legal-paths';

export type LegalLinkKey = 'privacy' | 'terms' | 'accountDeletion' | 'help';

const CONSUMER_LEGAL_KEYS = new Set<LegalLinkKey>(['privacy', 'terms', 'accountDeletion']);

const EXTERNAL_PATHS: Record<'help', string> = {
  help: '/help',
};

/** Same-origin href for F.7 canonical legal pages on Consumer Web. */
export function consumerLegalHref(
  key: Extract<LegalLinkKey, 'privacy' | 'terms' | 'accountDeletion'>,
): string {
  const segment: PublicLegalRootSegment =
    key === 'accountDeletion' ? 'account-deletion' : key;
  return publicLegalPath(segment);
}

/** Footer/support URLs. Migrated legal pages are relative; help remains external (deferred). */
export function legalPageUrl(key: LegalLinkKey): string {
  if (key === 'privacy') return consumerLegalHref('privacy');
  if (key === 'terms') return consumerLegalHref('terms');
  if (key === 'accountDeletion') return consumerLegalHref('accountDeletion');
  return `${getPublicSiteBaseUrl()}${EXTERNAL_PATHS.help}`;
}

export function isSameOriginLegalLink(key: LegalLinkKey): boolean {
  return CONSUMER_LEGAL_KEYS.has(key);
}
