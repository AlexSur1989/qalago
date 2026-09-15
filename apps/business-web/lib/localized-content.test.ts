import { describe, expect, it } from 'vitest';
import { subcategoryDisplayName } from './localized-content';

describe('subcategoryDisplayName', () => {
  const sub = { nameRu: 'Кафе', nameKk: 'Кафе KK' };

  it('RU locale uses nameRu', () => {
    expect(subcategoryDisplayName(sub, 'ru')).toBe('Кафе');
  });

  it('KK locale uses nameKk when present', () => {
    expect(subcategoryDisplayName(sub, 'kk')).toBe('Кафе KK');
  });

  it('KK locale falls back to nameRu when nameKk empty', () => {
    expect(subcategoryDisplayName({ nameRu: 'Кафе', nameKk: '' }, 'kk')).toBe('Кафе');
    expect(subcategoryDisplayName({ nameRu: 'Кафе', nameKk: '   ' }, 'kk')).toBe('Кафе');
  });
});
