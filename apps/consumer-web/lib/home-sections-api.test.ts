import { describe, expect, it, vi } from 'vitest';
import { HomeSectionPlatform, HomeSectionType } from '@qalago/shared-types';
import {
  fetchPublicHomeSections,
  orderedSectionTypes,
} from './home-sections-api';

describe('home-sections-api contract', () => {
  it('shared-types expose CW.3 section identifiers', () => {
    expect(HomeSectionType.CATEGORIES).toBe('CATEGORIES');
    expect(HomeSectionPlatform.WEB).toBe('WEB');
  });

  it('fetchPublicHomeSections filters disabled rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
          { type: HomeSectionType.NEARBY, enabled: false, position: 50 },
        ],
      })),
    );
    const rows = await fetchPublicHomeSections('uralsk', HomeSectionPlatform.WEB);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.type).toBe(HomeSectionType.CATEGORIES);
    vi.unstubAllGlobals();
  });

  it('orderedSectionTypes sorts by position', () => {
    const types = orderedSectionTypes([
      { type: HomeSectionType.NEARBY, enabled: true, position: 50 },
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
    ]);
    expect(types).toEqual([HomeSectionType.CATEGORIES, HomeSectionType.NEARBY]);
  });
});
