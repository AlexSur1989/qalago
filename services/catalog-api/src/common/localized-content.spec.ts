import {
  businessAuthoredText,
  cityDisplayName,
  normalizeOptionalLocaleText,
  promotionTitle,
  serviceItemTitle,
  taxonomyDisplayName,
} from './localized-content';

describe('localized-content (Stage 6.10B.6)', () => {
  it('returns nameRu and nameKk for city', () => {
    const city = { nameRu: 'Уральск', nameKk: 'Орал' };
    expect(cityDisplayName(city, 'ru')).toBe('Уральск');
    expect(cityDisplayName(city, 'kk')).toBe('Орал');
  });

  it('KK fallback to RU when nameKk missing', () => {
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: null }, 'kk')).toBe('Уральск');
  });

  it('taxonomy uses legacy title for RU when needed', () => {
    expect(taxonomyDisplayName('ru', '', 'KK', 'Legacy')).toBe('Legacy');
  });

  it('business-authored KK uses primary when translation missing', () => {
    expect(businessAuthoredText('kk', 'Coffee Boom', null)).toBe('Coffee Boom');
    expect(businessAuthoredText('kk', 'RU title', 'KK title')).toBe('KK title');
  });

  it('service item title isolation', () => {
    expect(serviceItemTitle('ru', { title: 'RU', titleKk: 'KK' })).toBe('RU');
    expect(serviceItemTitle('kk', { title: 'RU', titleKk: 'KK' })).toBe('KK');
  });

  it('promotion title fallback', () => {
    expect(promotionTitle('kk', { title: 'Акция', titleKk: null })).toBe('Акция');
  });

  it('normalizes whitespace-only optional fields to null', () => {
    expect(normalizeOptionalLocaleText('   ')).toBeNull();
    expect(normalizeOptionalLocaleText('  text  ')).toBe('text');
  });
});
