import { describe, expect, it } from 'vitest';
import { sliceHomeCategories } from './home-categories';

describe('home categories', () => {
  it('adds more slot when list exceeds two rows', () => {
    const all = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      title: `C${i}`,
      slug: `c${i}`,
    }));
    const { preview, showMore } = sliceHomeCategories(all, 4);
    expect(preview).toHaveLength(7);
    expect(showMore).toBe(true);
  });
});
