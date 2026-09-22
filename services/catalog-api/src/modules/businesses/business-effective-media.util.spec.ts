import {
  buildEffectiveMediaDto,
  resolveEffectiveMediaCoverUrl,
  selectEligibleVisibleImages,
  toPublicEffectiveMediaItem,
} from './business-effective-media.util';

const d = (n: number) => new Date(`2026-01-0${n}T00:00:00.000Z`);

function row(
  id: string,
  imageUrl: string,
  locationId: string | null,
  sortOrder: number,
  day: number,
): Parameters<typeof selectEligibleVisibleImages>[0][number] {
  return { id, imageUrl, locationId, sortOrder, createdAt: d(day) };
}

describe('business-effective-media.util', () => {
  const L1 = 'loc-1';
  const L2 = 'loc-2';

  const matrix = [
    row('shared-a', '/SHARED-A', null, 1, 1),
    row('shared-b', '/SHARED-B', null, 2, 2),
    row('l1-a', '/L1-A', L1, 1, 3),
    row('l1-b', '/L1-B', L1, 2, 4),
    row('l2-a', '/L2-A', L2, 1, 5),
    row('l2-b', '/L2-B', L2, 2, 6),
  ];

  it('L1: branch first then shared, no L2', () => {
    const eligible = selectEligibleVisibleImages(matrix, L1, 'active_location');
    expect(eligible.map((r) => r.imageUrl)).toEqual([
      '/L1-A',
      '/L1-B',
      '/SHARED-A',
      '/SHARED-B',
    ]);
  });

  it('L2: branch first then shared, no L1', () => {
    const eligible = selectEligibleVisibleImages(matrix, L2, 'active_location');
    expect(eligible.map((r) => r.imageUrl)).toEqual([
      '/L2-A',
      '/L2-B',
      '/SHARED-A',
      '/SHARED-B',
    ]);
  });

  it('business_wide keeps legacy ordering across all scopes', () => {
    const all = selectEligibleVisibleImages(matrix, L1, 'business_wide');
    expect(all.length).toBe(6);
  });

  it('effective cover prefers first branch image', () => {
    const eligible = selectEligibleVisibleImages(matrix, L2, 'active_location');
    expect(resolveEffectiveMediaCoverUrl('/brand-cover.jpg', eligible, L2)).toBe('/L2-A');
  });

  it('falls back to brand cover when branch images absent', () => {
    const brandOnly = matrix.filter((r) => r.locationId === null);
    expect(resolveEffectiveMediaCoverUrl('/SHARED-B', brandOnly, L2)).toBe('/SHARED-B');
  });

  it('falls back to first shared when brand cover not visible', () => {
    const brandOnly = matrix.filter((r) => r.locationId === null);
    expect(resolveEffectiveMediaCoverUrl('/missing-cover.jpg', brandOnly, L2)).toBe('/SHARED-A');
  });

  it('scope mapping for active location', () => {
    const eligible = selectEligibleVisibleImages(matrix, L2, 'active_location');
    expect(toPublicEffectiveMediaItem(eligible[0]!, L2, 'active_location').scope).toBe('branch');
    expect(toPublicEffectiveMediaItem(eligible[2]!, L2, 'active_location').scope).toBe('brand');
  });

  it('buildEffectiveMediaDto exposes preview totalCount after plan cap input', () => {
    const eligible = selectEligibleVisibleImages(matrix, L2, 'active_location');
    const published = eligible.slice(0, 3);
    const dto = buildEffectiveMediaDto(eligible, L2, null, published, published.slice(0, 2));
    expect(dto.activeLocationId).toBe(L2);
    expect(dto.galleryPreview.items).toHaveLength(2);
    expect(dto.galleryPreview.totalCount).toBe(3);
    expect(dto.coverImageUrl).toBe('/L2-A');
  });
});
