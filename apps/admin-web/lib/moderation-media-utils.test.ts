import { describe, expect, it } from 'vitest';
import {
  moderationMediaActionTargetId,
  moderationMediaScopeLabel,
} from './moderation-media-utils';
import type { ModerationMediaTarget } from './moderation-api';

describe('moderation media utils', () => {
  it('G — moderation action targets BusinessImage id', () => {
    const imageId = 'cmucmdtpg0005ulq4fpxk69f9';
    expect(moderationMediaActionTargetId(imageId)).toBe(imageId);
  });

  it('maps API mediaTarget to scope label', () => {
    const target: ModerationMediaTarget = {
      available: true,
      state: 'ACTIVE',
      id: 'img-1',
      locationId: null,
      imageUrl: '/uploads/x.png',
      moderationHidden: false,
    };
    expect(moderationMediaScopeLabel(target, 'ru')).toBe('Общие фото');
  });
});
