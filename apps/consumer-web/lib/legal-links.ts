import { publicHelpPath, publicLegalPath, type PublicLegalRootSegment } from './legal-paths';

export type LegalLinkKey = 'privacy' | 'terms' | 'accountDeletion' | 'help';

const CONSUMER_SAME_ORIGIN_KEYS = new Set<LegalLinkKey>([
  'privacy',
  'terms',
  'accountDeletion',
  'help',
]);

/** Same-origin href for F.7 canonical legal pages on Consumer Web. */
export function consumerLegalHref(
  key: Extract<LegalLinkKey, 'privacy' | 'terms' | 'accountDeletion'>,
): string {
  const segment: PublicLegalRootSegment =
    key === 'accountDeletion' ? 'account-deletion' : key;
  return publicLegalPath(segment);
}

/** Footer/support URLs — same-origin on Consumer Web (F.7 legal + public help). */
export function legalPageUrl(key: LegalLinkKey): string {
  if (key === 'privacy') return consumerLegalHref('privacy');
  if (key === 'terms') return consumerLegalHref('terms');
  if (key === 'accountDeletion') return consumerLegalHref('accountDeletion');
  return publicHelpPath();
}

export function isSameOriginLegalLink(key: LegalLinkKey): boolean {
  return CONSUMER_SAME_ORIGIN_KEYS.has(key);
}
