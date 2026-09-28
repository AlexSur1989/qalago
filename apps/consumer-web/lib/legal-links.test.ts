import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { UI_LABELS } from './locale';
import {
  consumerLegalHref,
  isSameOriginLegalLink,
  legalPageUrl,
} from './legal-links';

describe('legal-links', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('privacy/terms/account-deletion are same-origin paths', () => {
    expect(legalPageUrl('privacy')).toBe('/privacy');
    expect(legalPageUrl('terms')).toBe('/terms');
    expect(legalPageUrl('accountDeletion')).toBe('/account-deletion');
    expect(consumerLegalHref('privacy')).toBe('/privacy');
  });

  it('migrated legal links do not use Business Web origin', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'http://localhost:3003';
    expect(legalPageUrl('privacy')).toBe('/privacy');
    expect(legalPageUrl('terms')).not.toContain('3003');
    expect(legalPageUrl('accountDeletion')).not.toContain('localhost');
  });

  it('help is same-origin on Consumer Web regardless of public base env', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(legalPageUrl('help')).toBe('/help');
    expect(isSameOriginLegalLink('help')).toBe(true);
  });

  it('isSameOriginLegalLink identifies public footer pages', () => {
    expect(isSameOriginLegalLink('privacy')).toBe(true);
    expect(isSameOriginLegalLink('terms')).toBe(true);
    expect(isSameOriginLegalLink('accountDeletion')).toBe(true);
    expect(isSameOriginLegalLink('help')).toBe(true);
  });

  it('footer labels remain defined for RU and KK', () => {
    expect(UI_LABELS.ru.footerPrivacy).toBeTruthy();
    expect(UI_LABELS.ru.footerTerms).toBeTruthy();
    expect(UI_LABELS.ru.footerAccountDeletion).toBeTruthy();
    expect(UI_LABELS.kk.footerPrivacy).toBeTruthy();
    expect(UI_LABELS.kk.footerTerms).toBeTruthy();
    expect(UI_LABELS.kk.footerAccountDeletion).toBeTruthy();
  });
});
