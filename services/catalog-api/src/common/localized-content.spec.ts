import {
  businessAuthoredText,
  cityDisplayName,
  normalizeOptionalLocaleText,
  promotionDescription,
  promotionTitle,
  serviceItemDescription,
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

  it('service item description resolver', () => {
    expect(
      serviceItemDescription('ru', { description: 'RU', descriptionKk: 'KK' }),
    ).toBe('RU');
    expect(
      serviceItemDescription('kk', { description: 'RU', descriptionKk: 'KK' }),
    ).toBe('KK');
    expect(serviceItemDescription('kk', { description: 'RU', descriptionKk: null })).toBe(
      'RU',
    );
  });

  it('promotion description resolver', () => {
    expect(
      promotionDescription('kk', { description: 'RU', descriptionKk: 'KK' }),
    ).toBe('KK');
    expect(promotionDescription('ru', { description: 'RU', descriptionKk: 'KK' })).toBe(
      'RU',
    );
  });

  it('legacy records without KK fields resolve to primary', () => {
    expect(serviceItemTitle('kk', { title: 'Legacy item' })).toBe('Legacy item');
    expect(promotionTitle('kk', { title: 'Legacy promo' })).toBe('Legacy promo');
  });

  it('normalizes whitespace-only optional fields to null', () => {
    expect(normalizeOptionalLocaleText('   ')).toBeNull();
    expect(normalizeOptionalLocaleText('  text  ')).toBe('text');
  });
});
