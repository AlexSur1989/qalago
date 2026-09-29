import { describe, expect, it } from 'vitest';
import { parseAdminCatalogApiError } from './admin-catalog-errors';

describe('admin catalog API errors (AOP.7H.1)', () => {
  it('maps 403 to localized forbidden message (RU)', () => {
    const parsed = parseAdminCatalogApiError(new Error('403 Forbidden'), 'ru');
    expect(parsed.kind).toBe('forbidden');
    expect(parsed.message).toBe('Недостаточно прав для этого действия.');
  });

  it('maps 403 to localized forbidden message (KK)', () => {
    const parsed = parseAdminCatalogApiError(new Error('403 Forbidden'), 'kk');
    expect(parsed.kind).toBe('forbidden');
    expect(parsed.message).toBe('Бұл әрекет үшін құқық жеткіліксіз.');
  });
});
