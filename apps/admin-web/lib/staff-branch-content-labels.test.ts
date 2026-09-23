import { describe, expect, it } from 'vitest';
import {
  branchScopeUsesRawIdAsPrimary,
  formatStaffBranchLine,
  formatStaffBranchScopeSummary,
  staffBranchContentLabel,
} from './staff-branch-content-labels';

describe('staff branch content labels (A.7.8.6)', () => {
  it('ALL RU/KK', () => {
    expect(
      formatStaffBranchScopeSummary({ mode: 'ALL', branches: [] }, 'ru'),
    ).toEqual(['Все филиалы']);
    expect(
      formatStaffBranchScopeSummary({ mode: 'ALL', branches: [] }, 'kk'),
    ).toEqual(['Барлық филиалдар']);
  });

  it('SELECTED branch with address and city', () => {
    const line = formatStaffBranchLine(
      {
        locationId: 'loc-1',
        address: 'ул. Сейфуллина, 22',
        cityNameRu: 'Уральск',
        cityNameKk: 'Орал',
        isPrimary: true,
        available: true,
      },
      'ru',
    );
    expect(line).toContain('ул. Сейфуллина, 22');
    expect(line).toContain('Уральск');
    expect(line).toContain(staffBranchContentLabel('ru', 'primaryBranch'));
  });

  it('unavailable branch', () => {
    expect(
      formatStaffBranchLine(
        {
          locationId: 'missing',
          address: null,
          cityNameRu: null,
          cityNameKk: null,
          isPrimary: false,
          available: false,
        },
        'kk',
      ),
    ).toBe('Филиал қолжетімсіз');
  });

  it('does not use raw id as primary label for available branches', () => {
    expect(
      branchScopeUsesRawIdAsPrimary({
        mode: 'SELECTED',
        branches: [
          {
            locationId: 'cmud4s8ww0001ulc8jck710tp',
            address: 'пр. Абая, 88',
            cityNameRu: 'Уральск',
            cityNameKk: 'Орал',
            isPrimary: false,
            available: true,
          },
        ],
      }),
    ).toBe(false);
  });

  it('unavailable SELECTED is not ALL', () => {
    const lines = formatStaffBranchScopeSummary(
      {
        mode: 'SELECTED',
        branches: [
          {
            locationId: 'gone',
            address: null,
            cityNameRu: null,
            cityNameKk: null,
            isPrimary: false,
            available: false,
          },
        ],
      },
      'ru',
    );
    expect(lines[0]).toBe('Филиал недоступен');
    expect(lines[0]).not.toBe('Все филиалы');
  });
});
