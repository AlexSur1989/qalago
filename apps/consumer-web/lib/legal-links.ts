import { getPublicSiteBaseUrl } from './public-config';

export type LegalLinkKey = 'privacy' | 'terms' | 'accountDeletion' | 'help';

const PATHS: Record<LegalLinkKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  accountDeletion: '/account-deletion',
  help: '/help',
};

export function legalPageUrl(key: LegalLinkKey): string {
  return `${getPublicSiteBaseUrl()}${PATHS[key]}`;
}
