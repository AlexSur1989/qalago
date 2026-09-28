import { describe, expect, it } from 'vitest';
import {
  hasUnresolvedLegalPlaceholders,
  publicLegalUrl,
} from './legal-config';

describe('legal-config', () => {
  it('migrated legal URLs point at consumer web origin', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(publicLegalUrl('/privacy')).toBe('https://qalago.kz/privacy');
    expect(publicLegalUrl('/account-deletion')).toBe(
      'https://qalago.kz/account-deletion',
    );
  });

  it('support path still uses public site base', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(publicLegalUrl('/support')).toBe('https://qalago.kz/help');
  });

  it('detects unresolved placeholders by default in dev', () => {
    expect(hasUnresolvedLegalPlaceholders()).toBe(true);
  });
});
