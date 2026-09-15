import { describe, expect, it } from 'vitest';
import { cityDisplayName, homeTaglineForCity } from './localized-content';

describe('consumer-web localized content', () => {
  it('city RU and KK', () => {
    const city = { nameRu: 'Уральск', nameKk: 'Орал' };
    expect(cityDisplayName(city, 'ru')).toBe('Уральск');
    expect(cityDisplayName(city, 'kk')).toBe('Орал');
  });

  it('city KK fallback', () => {
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: null }, 'kk')).toBe('Уральск');
  });

  it('home tagline uses city name from data', () => {
    expect(homeTaglineForCity('ru', 'Уральск')).toContain('Уральск');
    expect(homeTaglineForCity('kk', 'Орал')).toContain('Орал');
  });
});
