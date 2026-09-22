import { describe, expect, it } from 'vitest';
import {
  businessImageScopeLabel,
  formatStaffMediaBranchLine,
  staffMediaLabel,
} from './staff-media-labels';

const L1 = 'bl7085ee9a617ae8b64026db';
const L2 = 'cmubk34fk0001uls458d1nta9';

describe('staff media scope labels (A.7.7.6)', () => {
  it('A — locationId null → shared/brand label (RU/KK)', () => {
    expect(businessImageScopeLabel({ locationId: null }, 'ru')).toBe('Общие фото');
    expect(businessImageScopeLabel({ locationId: null }, 'kk')).toBe('Ортақ фотолар');
  });

  it('B/C — branch image → address + primary (RU/KK)', () => {
    const branch = {
      address: 'пр. Абая, 88',
      isPrimary: false,
      city: { nameRu: 'Уральск', nameKk: 'Орал' },
    };
    expect(
      businessImageScopeLabel({ locationId: L2, branch }, 'ru'),
    ).toBe('Филиал: пр. Абая, 88 · Уральск');
    expect(
      businessImageScopeLabel(
        { locationId: L2, branch: { ...branch, isPrimary: true } },
        'ru',
      ),
    ).toContain('основной филиал');
    expect(
      businessImageScopeLabel({ locationId: L2, branch }, 'kk'),
    ).toBe('Филиал: пр. Абая, 88 · Орал');
  });

  it('D — L1 and L2 labels differ', () => {
    const l1 = businessImageScopeLabel(
      {
        locationId: L1,
        branch: {
          address: 'ул. Сейфуллина, 22',
          isPrimary: true,
          city: { nameRu: 'Уральск', nameKk: 'Орал' },
        },
      },
      'ru',
    );
    const l2 = businessImageScopeLabel(
      {
        locationId: L2,
        branch: {
          address: 'пр. Абая, 88',
          isPrimary: false,
          city: { nameRu: 'Уральск', nameKk: 'Орал' },
        },
      },
      'ru',
    );
    expect(l1).not.toBe(l2);
    expect(l1).toContain('Сейфуллина');
    expect(l2).toContain('Абая');
  });

  it('E/F — branch scoped but missing location → unavailable, not shared', () => {
    expect(
      businessImageScopeLabel(
        { locationId: L2, branchUnavailable: true, branch: null },
        'ru',
      ),
    ).toBe('Филиал недоступен');
    expect(
      businessImageScopeLabel(
        { locationId: L2, branchUnavailable: true, branch: null },
        'kk',
      ),
    ).toBe('Филиал қолжетімсіз');
  });

  it('H/I — localization keys', () => {
    expect(staffMediaLabel('ru', 'sharedPhotos')).toBe('Общие фото');
    expect(staffMediaLabel('kk', 'sharedPhotos')).toBe('Ортақ фотолар');
    expect(formatStaffMediaBranchLine(
      { address: 'пр. Абая, 88', isPrimary: true, city: { nameRu: 'Уральск', nameKk: 'Орал' } },
      'kk',
    )).toContain('негізгі филиал');
  });

  it('J — brand/shared compatible (no branch fields)', () => {
    expect(businessImageScopeLabel({ locationId: undefined }, 'ru')).toBe('Общие фото');
  });
});
