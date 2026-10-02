import { describe, expect, it } from 'vitest';
import { HomeSectionType } from '@qalago/shared-types';
import { HOME_SECTION_LABELS } from './home-sections-ui';

describe('home-sections-ui', () => {
  it('labels all section types', () => {
    for (const type of Object.values(HomeSectionType)) {
      expect(HOME_SECTION_LABELS[type]?.length).toBeGreaterThan(0);
    }
  });
});
