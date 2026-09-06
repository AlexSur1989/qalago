import { describe, expect, it } from 'vitest';
import { hasMoreMenuPages, menuSectionLabel, shouldShowSeeAll } from './menu-utils';

describe('menu-utils', () => {
  it('shouldShowSeeAll when total exceeds preview', () => {
    expect(shouldShowSeeAll(300, 6)).toBe(true);
    expect(shouldShowSeeAll(6, 6)).toBe(false);
    expect(shouldShowSeeAll(0, 6)).toBe(false);
  });

  it('menuSectionLabel resolves section title', () => {
    const sections = [
      { id: 's1', title: 'Смартфоны', sortOrder: 0, isActive: true, itemCount: 10 },
    ];
    expect(menuSectionLabel('s1', sections)).toBe('Смартфоны');
    expect(menuSectionLabel(null, sections)).toBe('Без группы');
    expect(menuSectionLabel('missing', sections)).toBe('Без группы');
  });

  it('hasMoreMenuPages detects next page', () => {
    expect(hasMoreMenuPages(1, 3)).toBe(true);
    expect(hasMoreMenuPages(3, 3)).toBe(false);
  });
});
