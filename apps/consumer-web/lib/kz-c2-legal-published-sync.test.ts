import { describe, expect, it } from 'vitest';
import { PUBLISHED_PLATFORM_LEGAL_VERSIONS } from '@qalago/shared-types';
import { publishedLegalMetaForPage } from './legal-published-sync';

describe('KZ-C.2 published legal sync', () => {
  it('terms page meta matches shared manifest', () => {
    const meta = publishedLegalMetaForPage('terms');
    expect(meta?.version).toBe(PUBLISHED_PLATFORM_LEGAL_VERSIONS.TERMS_OF_SERVICE.version);
  });

  it('privacy page meta matches shared manifest', () => {
    const meta = publishedLegalMetaForPage('privacy');
    expect(meta?.version).toBe(PUBLISHED_PLATFORM_LEGAL_VERSIONS.PRIVACY_POLICY.version);
  });
});
