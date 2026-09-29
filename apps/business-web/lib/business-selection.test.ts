import { describe, expect, it } from 'vitest';
import {
  resolveSelectedBusinessId,
  resolveSelectedBusinessRowId,
  resolveSelectedMyBusinessItem,
} from './business-selection';
import { BusinessPermission } from './business-access';

const items = [
  {
    business: { id: 'b-a', title: 'A', status: 'ACTIVE', address: '1' },
    access: { role: 'OWNER' as const, permissions: [] },
  },
  {
    business: { id: 'b-b', title: 'B', status: 'ACTIVE', address: '2' },
    access: { role: 'OWNER' as const, permissions: [] },
  },
];

describe('business-selection (BIZ.2)', () => {
  it('returns null when no accessible businesses', () => {
    expect(resolveSelectedBusinessId([], 'b-a')).toBeNull();
  });

  it('keeps valid stored selection', () => {
    expect(resolveSelectedBusinessId(items, 'b-b')).toBe('b-b');
  });

  it('falls back when stored id is stale', () => {
    expect(resolveSelectedBusinessId(items, 'deleted-id')).toBe('b-a');
  });

  it('resolveSelectedBusinessRowId matches items rule', () => {
    const rows = items.map((i) => i.business);
    expect(resolveSelectedBusinessRowId(rows, 'stale')).toBe('b-a');
  });

  it('resolveSelectedMyBusinessItem uses stored id, not arbitrary items[0] access', () => {
    const multi = [
      {
        business: { id: 'coffee-lab', title: 'Aktobe Coffee Lab', status: 'ACTIVE', address: '1' },
        access: {
          role: 'MANAGER' as const,
          permissions: [BusinessPermission.CATALOG_EDIT],
        },
      },
      {
        business: { id: 'bar-code-51', title: 'Bar Code 51', status: 'ACTIVE', address: '2' },
        access: {
          role: 'MANAGER' as const,
          permissions: [BusinessPermission.ANALYTICS_VIEW],
        },
      },
    ];
    const picked = resolveSelectedMyBusinessItem(multi, 'bar-code-51');
    expect(picked?.business.id).toBe('bar-code-51');
    expect(picked?.access.permissions).toContain(BusinessPermission.ANALYTICS_VIEW);
    expect(picked?.access.permissions).not.toContain(BusinessPermission.CATALOG_EDIT);
  });
});
