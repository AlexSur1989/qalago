import { describe, expect, it } from 'vitest';
import { LEGAL_PLACEHOLDERS } from './legal-config';
import { publicLegalPath } from './legal-paths';

describe('legal-config', () => {
  it('placeholder keys match business-web contract', () => {
    expect(Object.keys(LEGAL_PLACEHOLDERS).sort()).toEqual(
      [
        'legalAddress',
        'legalContactEmail',
        'legalJurisdiction',
        'operatorName',
        'privacyContactEmail',
        'supportContactEmail',
      ].sort(),
    );
  });

  it('legal paths stay locale-neutral', () => {
    expect(publicLegalPath('terms')).toBe('/terms');
  });
});
