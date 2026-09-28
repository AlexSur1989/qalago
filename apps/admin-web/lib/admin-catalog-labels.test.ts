import { describe, expect, it } from 'vitest';
import { adminCatalogLabel, adminCatalogLabelKeys } from './admin-catalog-labels';

describe('admin catalog labels RU/KK parity (AOP.2)', () => {
  it('every RU key exists in KK', () => {
    for (const key of adminCatalogLabelKeys()) {
      expect(adminCatalogLabel('kk', key).length).toBeGreaterThan(0);
      expect(adminCatalogLabel('ru', key)).not.toEqual('');
    }
  });
});
