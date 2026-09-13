import { BadRequestException } from '@nestjs/common';
import { normalizeCategoryNames } from './category-normalize.util';

describe('normalizeCategoryNames', () => {
  it('derives title from nameRu', () => {
    expect(
      normalizeCategoryNames({ nameRu: 'Рестораны', nameKk: 'Мейрамханалар' }),
    ).toEqual({
      title: 'Рестораны',
      nameRu: 'Рестораны',
      nameKk: 'Мейрамханалар',
    });
  });

  it('legacy title-only create maps to nameRu and nameKk', () => {
    expect(normalizeCategoryNames({ title: 'Фитнес' })).toEqual({
      title: 'Фитнес',
      nameRu: 'Фитнес',
      nameKk: 'Фитнес',
    });
  });

  it('rejects empty names', () => {
    expect(() => normalizeCategoryNames({})).toThrow(BadRequestException);
  });
});
