import { describe, expect, it } from 'vitest';
import { legalPackDocumentVersion, loadLegalPackBody, loadLegalPackTitle } from './legal-pack-loader';

describe('legal-pack-loader', () => {
  it('loads RU and KK privacy bodies from docs/legal', () => {
    const ru = loadLegalPackBody('privacy-policy', 'ru');
    const kk = loadLegalPackBody('privacy-policy', 'kk');
    expect(ru).toContain('Оператор');
    expect(kk).toContain('Оператор');
    expect(ru).not.toEqual(kk);
  });

  it('uses pack content version constant', () => {
    expect(legalPackDocumentVersion()).toBe('2026-10-03-draft-1');
  });

  it('loads titles', () => {
    expect(loadLegalPackTitle('terms-of-use', 'ru')).toContain('QalaGo');
  });
});
