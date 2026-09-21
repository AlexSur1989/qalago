import { describe, expect, it } from 'vitest';
import {
  findCategoryById,
  findCategoryBySlug,
  findSubcategoryBySlug,
} from './category-resolve';
import type { CategoryDto, SubcategoryDto } from './catalog-api';
import { toPublicBusinessCard, temporaryBusinessDetailPath } from './public-business';
import { isReservedCitySegment } from './reserved-segments';
import {
  cityCategoryPath,
  cityHomePath,
  citySearchPath,
  citySubcategoryPath,
  defaultCityHomePath,
  parseCitySlugFromPathname,
} from './routes';
import {
  isSearchQueryTooShort,
  normalizeSearchQuery,
  parsePageParam,
} from './search-query';
import { categoryDisplayName, UI_LABELS } from './locale';

const categories: CategoryDto[] = [
  {
    id: 'cat-1',
    slug: 'restaurants',
    title: 'Рестораны',
    nameRu: 'Рестораны',
    nameKk: 'Мейрамханалар',
    sortOrder: 1,
  },
  {
    id: 'cat-hidden-reserved',
    slug: 'search',
    title: 'X',
    nameRu: 'X',
    nameKk: 'X',
    sortOrder: 2,
  },
];

const subs: SubcategoryDto[] = [
  {
    id: 'sub-1',
    categoryId: 'cat-1',
    slug: 'cafes',
    nameRu: 'Кафе',
    nameKk: 'Кафелер',
    sortOrder: 1,
  },
];

describe('F.2 discovery', () => {
  it('root default city path', () => {
    expect(defaultCityHomePath()).toBe('/uralsk');
    expect(cityHomePath('astana')).toBe('/astana');
  });

  it('parseCitySlugFromPathname', () => {
    expect(parseCitySlugFromPathname('/uralsk/restaurants')).toBe('uralsk');
    expect(parseCitySlugFromPathname('/categories')).toBeNull();
    expect(parseCitySlugFromPathname('/businesses/id')).toBeNull();
  });

  it('reserved segments block category resolution', () => {
    expect(isReservedCitySegment('categories')).toBe(true);
    expect(findCategoryBySlug(categories, 'categories')).toBeUndefined();
    expect(findCategoryBySlug(categories, 'restaurants')?.id).toBe('cat-1');
  });

  it('legacy category id maps to slug path', () => {
    const c = findCategoryById(categories, 'cat-1');
    expect(c && cityCategoryPath('uralsk', c.slug)).toBe('/uralsk/restaurants');
  });

  it('subcategory slug resolves under parent', () => {
    expect(findSubcategoryBySlug(subs, 'cafes', 'cat-1')?.id).toBe('sub-1');
    expect(findSubcategoryBySlug(subs, 'cafes', 'other')).toBeUndefined();
    expect(citySubcategoryPath('uralsk', 'restaurants', 'cafes')).toBe(
      '/uralsk/restaurants/cafes',
    );
  });

  it('search query normalization', () => {
    expect(normalizeSearchQuery('  foo   bar  ')).toBe('foo bar');
    expect(isSearchQueryTooShort('a')).toBe(true);
    expect(isSearchQueryTooShort('')).toBe(false);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('-1')).toBe(1);
  });

  it('city search path is shareable GET URL', () => {
    expect(citySearchPath('uralsk', 'coffee')).toBe('/uralsk/search?q=coffee');
  });

  it('RU/KK category labels; business title unchanged in public card', () => {
    expect(categoryDisplayName(categories[0]!, 'ru')).toBe('Рестораны');
    expect(categoryDisplayName(categories[0]!, 'kk')).toBe('Мейрамханалар');
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'AutoDrive Service',
      slug: 'autodrive',
      address: 'Addr',
      averageRating: 4.5,
      reviewCount: 3,
    });
    expect(card.title).toBe('AutoDrive Service');
    expect(card.reviewCount).toBe(3);
    expect(temporaryBusinessDetailPath('b1')).toBe('/businesses/b1');
  });

  it('public card omits internal fields', () => {
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'T',
      slug: 't',
      address: 'A',
      // @ts-expect-error simulate API leak
      ownerId: 'secret',
      planTier: 'PRO',
    } as never);
    expect(Object.keys(card)).not.toContain('ownerId');
    expect(Object.keys(card)).not.toContain('planTier');
  });

  it('locale packs define search and city switcher labels', () => {
    expect(UI_LABELS.ru.searchLabel.length).toBeGreaterThan(0);
    expect(UI_LABELS.kk.citySwitcherLabel.length).toBeGreaterThan(0);
  });
});
