import { ContentReportTargetType } from '@prisma/client';
import {
  isMediaTargetCase,
  resolveModerationMediaTarget,
} from './moderation-case-detail.util';

describe('Stage 6.12A.7.7.6 moderation media target', () => {
  it('isMediaTargetCase only for MEDIA', () => {
    expect(isMediaTargetCase(ContentReportTargetType.MEDIA)).toBe(true);
    expect(isMediaTargetCase(ContentReportTargetType.REVIEW)).toBe(false);
  });

  it('resolveModerationMediaTarget — brand/shared', () => {
    const dto = resolveModerationMediaTarget({
      id: 'img-brand',
      imageUrl: '/uploads/a.png',
      locationId: null,
      moderationHidden: false,
      business: {
        id: 'biz-1',
        title: 'Bar Code 51',
        city: { id: 'c1', slug: 'uralsk', nameRu: 'Уральск' },
      },
      branchLocation: null,
    });
    expect(dto.available).toBe(true);
    expect(dto.locationId).toBeNull();
    expect(dto.branch).toBeNull();
    expect(dto.branchUnavailable).toBeUndefined();
  });

  it('resolveModerationMediaTarget — branch with location', () => {
    const dto = resolveModerationMediaTarget({
      id: 'img-l2',
      imageUrl: '/uploads/b.png',
      locationId: 'cmubk34fk0001uls458d1nta9',
      moderationHidden: false,
      business: {
        id: 'biz-1',
        title: 'Bar Code 51',
        city: { id: 'c1', slug: 'uralsk', nameRu: 'Уральск' },
      },
      branchLocation: {
        id: 'cmubk34fk0001uls458d1nta9',
        address: 'пр. Абая, 88',
        isPrimary: false,
        city: {
          id: 'c1',
          slug: 'uralsk',
          nameRu: 'Уральск',
          nameKk: 'Орал',
        },
      },
    });
    expect(dto.branch?.address).toBe('пр. Абая, 88');
    expect(dto.branchUnavailable).toBeUndefined();
  });

  it('resolveModerationMediaTarget — missing branch row', () => {
    const dto = resolveModerationMediaTarget({
      id: 'img-orphan',
      imageUrl: '/uploads/c.png',
      locationId: 'missing-loc',
      moderationHidden: false,
      business: {
        id: 'biz-1',
        title: 'Bar Code 51',
        city: null,
      },
      branchLocation: null,
    });
    expect(dto.branchUnavailable).toBe(true);
    expect(dto.branch).toBeNull();
  });

  it('resolveModerationMediaTarget — missing image', () => {
    expect(resolveModerationMediaTarget(null).state).toBe('MISSING');
  });
});
