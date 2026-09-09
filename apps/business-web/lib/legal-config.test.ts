import { describe, expect, it } from 'vitest';
import {
  hasUnresolvedLegalPlaceholders,
  publicLegalUrl,
  publicSiteBaseUrl,
} from './legal-config';

describe('legal-config', () => {
  it('builds production-style URLs', () => {
    expect(publicLegalUrl('/privacy')).toBe(`${publicSiteBaseUrl}/privacy`);
    expect(publicLegalUrl('/account-deletion')).toContain('/account-deletion');
  });

  it('detects unresolved placeholders by default in dev', () => {
    expect(hasUnresolvedLegalPlaceholders()).toBe(true);
  });
});
