import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';
import type { BusinessImageRow, BusinessLocationRow, CityRow } from './api';
import {
  buildAttachBusinessImageBody,
  buildGlobalPhotoPublishIndexMap,
  buildListBusinessImagesPath,
  buildListBusinessImagesQuery,
  canSetBusinessCover,
  formatBranchMediaLabel,
  isBrandMediaScope,
  MEDIA_SCOPE_BRAND,
  normalizeMediaScopeAfterLocationsLoad,
} from './media-scope';

const L1 = 'loc-l1';
const L2 = 'loc-l2';

describe('media scope (6.12A.7.7.4)', () => {
  it('A — default scope is brand', () => {
    expect(MEDIA_SCOPE_BRAND).toBe('brand');
    expect(isBrandMediaScope(MEDIA_SCOPE_BRAND)).toBe(true);
  });

  it('B — brand list uses scope=brand', () => {
    expect(buildListBusinessImagesQuery(MEDIA_SCOPE_BRAND)).toEqual({ scope: 'brand' });
    expect(buildListBusinessImagesPath('biz-1', { scope: 'brand' })).toBe(
      '/uploads/business/biz-1/images?scope=brand',
    );
  });

  it('C — selecting L2 requests locationId=L2', () => {
    expect(buildListBusinessImagesQuery(L2)).toEqual({ locationId: L2 });
    expect(buildListBusinessImagesPath('biz-1', { locationId: L2 })).toBe(
      '/uploads/business/biz-1/images?locationId=loc-l2',
    );
  });

  it('D — brand upload attaches without branch locationId', () => {
    expect(buildAttachBusinessImageBody('/a.jpg', MEDIA_SCOPE_BRAND, true)).toEqual({
      imageUrl: '/a.jpg',
      asCover: true,
    });
  });

  it('E — L2 upload attaches with L2 locationId', () => {
    expect(buildAttachBusinessImageBody('/b.jpg', L2, false)).toEqual({
      imageUrl: '/b.jpg',
      locationId: L2,
    });
  });

  it('F — branch scope cannot set business cover', () => {
    expect(canSetBusinessCover(L2)).toBe(false);
  });

  it('G — brand scope retains cover action', () => {
    expect(canSetBusinessCover(MEDIA_SCOPE_BRAND)).toBe(true);
  });

  it('H — delete refresh is page concern; scope query stable after reload', () => {
    expect(buildListBusinessImagesQuery(L1)).toEqual({ locationId: L1 });
  });

  it('I — L1 and L2 queries differ (no mixed scope in one request)', () => {
    expect(buildListBusinessImagesQuery(L1).locationId).not.toBe(
      buildListBusinessImagesQuery(L2).locationId,
    );
  });

  it('J — branch labels use address not raw id', () => {
    const location: BusinessLocationRow = {
      id: L2,
      businessId: 'biz',
      cityId: 'city-1',
      address: 'Абая, 88',
      latitude: null,
      longitude: null,
      locationSource: null,
      workHours: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      website: null,
      isPrimary: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const cities: CityRow[] = [
      { id: 'city-1', slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
    ];
    const label = formatBranchMediaLabel('ru', location, cities, 'основной');
    expect(label).toContain('Абая, 88');
    expect(label).not.toContain(L2);
  });

  it('K — disappearing selected branch falls back to brand', () => {
    expect(normalizeMediaScopeAfterLocationsLoad(L2, [])).toBe(MEDIA_SCOPE_BRAND);
    expect(
      normalizeMediaScopeAfterLocationsLoad(L2, [
        { id: L1 } as BusinessLocationRow,
      ]),
    ).toBe(MEDIA_SCOPE_BRAND);
  });

  it('L — global publish index uses all images ordering', () => {
    const rows: BusinessImageRow[] = [
      { id: 'b', businessId: 'x', imageUrl: '/b', sortOrder: 2, locationId: null },
      { id: 'a', businessId: 'x', imageUrl: '/a', sortOrder: 1, locationId: L2 },
    ];
    const map = buildGlobalPhotoPublishIndexMap(rows);
    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(1);
  });

  it('M — RU media scope strings', () => {
    expect(UI_LABELS.ru.mediaScopeBrand).toBe('Общие фото');
    expect(UI_LABELS.ru.mediaScopeBranchesHeading).toBe('Филиалы');
    expect(UI_LABELS.ru.mediaScopePrimarySuffix).toBe('основной');
  });

  it('N — KK media scope strings', () => {
    expect(UI_LABELS.kk.mediaScopeBrand).toBe('Ортақ фото');
    expect(UI_LABELS.kk.mediaScopeBranchesHeading).toBe('Филиалдар');
    expect(UI_LABELS.kk.mediaScopePrimarySuffix).toBe('негізгі филиал');
  });
});
