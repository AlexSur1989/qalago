import { getConsumerWebOrigin } from './consumer-web-origin';

export const CONSUMER_WEB_MIGRATED_LEGAL_PATHS = [
  '/privacy',
  '/terms',
  '/account-deletion',
] as const;

export type ConsumerWebMigratedLegalPath = (typeof CONSUMER_WEB_MIGRATED_LEGAL_PATHS)[number];

/** Absolute URL on Consumer Web for a canonical locale-neutral legal path. */
export function consumerWebLegalUrl(path: ConsumerWebMigratedLegalPath): string {
  if (!CONSUMER_WEB_MIGRATED_LEGAL_PATHS.includes(path)) {
    throw new Error('Invalid consumer web legal path');
  }
  return `${getConsumerWebOrigin()}${path}`;
}
