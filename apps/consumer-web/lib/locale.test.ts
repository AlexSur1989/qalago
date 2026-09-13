import { describe, expect, it } from 'vitest';
import { categoryDisplayName, normalizeLocale, subcategoryDisplayName } from './locale';

describe('consumer-web locale', () => {
  it('normalizes kk locale', () => {
    expect(normalizeLocale('kk-KZ')).toBe('kk');
    expect(normalizeLocale('ru')).toBe('ru');
  });

  it('renders RU and KZ category names', () => {
    const cat = { nameRu: 'Фитнес', nameKk: 'Фитнес', title: 'Фитнес' };
    expect(categoryDisplayName(cat, 'ru')).toBe('Фитнес');
    expect(categoryDisplayName(cat, 'kk')).toBe('Фитнес');
    expect(categoryDisplayName({ nameRu: 'Красота', nameKk: 'Сұлулық', title: 'Красота' }, 'kk')).toBe(
      'Сұлулық',
    );
  });

  it('renders subcategory names by locale', () => {
    expect(subcategoryDisplayName({ nameRu: 'Кафе', nameKk: 'Кафелер' }, 'kk')).toBe('Кафелер');
  });
});
