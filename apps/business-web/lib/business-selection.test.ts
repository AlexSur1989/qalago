import { describe, expect, it } from 'vitest';
import { resolveSelectedBusinessId, resolveSelectedBusinessRowId } from './business-selection';

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
});
