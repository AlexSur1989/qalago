import { presentCategory, presentSubcategory } from './category-presenter.util';

describe('category-presenter', () => {
  it('exposes iconUrl alias without changing icon', () => {
    const row = presentCategory({
      id: '1',
      title: 'Еда',
      slug: 'food',
      icon: '/uploads/x.webp',
      sortOrder: 0,
      isActive: true,
    });
    expect(row.icon).toBe('/uploads/x.webp');
    expect(row.iconUrl).toBe('/uploads/x.webp');
  });

  it('null icon yields null iconUrl', () => {
    const row = presentSubcategory({
      id: 's1',
      categoryId: '1',
      slug: 'cafe',
      nameRu: 'Кафе',
      nameKk: 'Кафе',
      icon: null,
      sortOrder: 0,
    });
    expect(row.iconUrl).toBeNull();
  });
});
