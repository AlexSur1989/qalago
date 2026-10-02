import { describe, expect, it } from 'vitest';
import { HomeSectionPlatform, HomeSectionType } from '@qalago/shared-types';

describe('home-sections-api contract', () => {
  it('shared-types expose CW.3 section identifiers', () => {
    expect(HomeSectionType.CATEGORIES).toBe('CATEGORIES');
    expect(HomeSectionPlatform.WEB).toBe('WEB');
  });
});
