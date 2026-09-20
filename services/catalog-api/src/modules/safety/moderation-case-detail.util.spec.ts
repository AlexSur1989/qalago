import { resolveModerationReviewTarget } from './moderation-case-detail.util';

describe('resolveModerationReviewTarget', () => {
  const baseReview = {
    id: 'r1',
    rating: 4,
    text: 'hello',
    ownerReply: null,
    moderationHidden: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    user: { id: 'u1', name: 'User', phone: '+7700' },
    business: {
      id: 'b1',
      title: 'Cafe',
      city: { id: 'c1', slug: 'uralsk', nameRu: 'Уральск' },
    },
  };

  it('marks missing target', () => {
    expect(resolveModerationReviewTarget(null).state).toBe('MISSING');
  });

  it('detects moderation hidden and soft-deleted states', () => {
    expect(
      resolveModerationReviewTarget({ ...baseReview, moderationHidden: true }).state,
    ).toBe('MODERATION_HIDDEN');
    expect(
      resolveModerationReviewTarget({
        ...baseReview,
        deletedAt: new Date(),
      }).state,
    ).toBe('USER_SOFT_DELETED');
  });

  it('public visibility follows moderation and user delete', () => {
    expect(resolveModerationReviewTarget(baseReview).publiclyVisible).toBe(true);
    expect(
      resolveModerationReviewTarget({ ...baseReview, moderationHidden: true })
        .publiclyVisible,
    ).toBe(false);
    expect(
      resolveModerationReviewTarget({ ...baseReview, deletedAt: new Date() })
        .publiclyVisible,
    ).toBe(false);
  });
});
