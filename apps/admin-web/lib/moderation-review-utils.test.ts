import { describe, expect, it } from 'vitest';
import {
  reviewPublicVisibilityLabel,
  reviewTargetStateLabel,
} from './moderation-review-utils';

describe('moderation-review-utils', () => {
  it('labels review target lifecycle states', () => {
    expect(reviewTargetStateLabel('MODERATION_HIDDEN')).toContain('модерац');
    expect(reviewTargetStateLabel('USER_SOFT_DELETED')).toContain('автор');
  });

  it('labels public visibility', () => {
    expect(reviewPublicVisibilityLabel(true)).toContain('Виден');
    expect(reviewPublicVisibilityLabel(false)).toContain('Не виден');
  });
});
