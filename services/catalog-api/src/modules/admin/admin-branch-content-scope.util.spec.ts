import {
  buildAdminBranchScope,
  groupAssignmentLocationIds,
  type AdminBranchLocationRow,
} from './admin-branch-content-scope.util';

const L1 = 'loc-l1';
const L2 = 'loc-l2';
const FOREIGN = 'loc-foreign';

function loc(id: string, address: string, isPrimary: boolean): AdminBranchLocationRow {
  return {
    id,
    address,
    isPrimary,
    city: { nameRu: 'Уральск', nameKk: 'Орал' },
  };
}

describe('admin-branch-content-scope (A.7.8.6)', () => {
  it('1 — zero assignments → ALL', () => {
    expect(buildAdminBranchScope([], new Map())).toEqual({
      mode: 'ALL',
      branches: [],
    });
  });

  it('2 — one selected branch', () => {
    const map = new Map([[L2, loc(L2, 'пр. Абая, 88', false)]]);
    const scope = buildAdminBranchScope([L2], map);
    expect(scope.mode).toBe('SELECTED');
    expect(scope.branches).toHaveLength(1);
    expect(scope.branches[0]?.available).toBe(true);
    expect(scope.branches[0]?.address).toBe('пр. Абая, 88');
  });

  it('3 — multiple selected branches sorted', () => {
    const map = new Map([
      [L2, loc(L2, 'B', false)],
      [L1, loc(L1, 'A', true)],
    ]);
    const scope = buildAdminBranchScope([L2, L1], map);
    expect(scope.branches.map((b) => b.locationId)).toEqual([L1, L2]);
  });

  it('4 — primary branch flagged', () => {
    const map = new Map([[L1, loc(L1, 'ул. Сейфуллина, 22', true)]]);
    expect(buildAdminBranchScope([L1], map).branches[0]?.isPrimary).toBe(true);
  });

  it('5 — missing branch stays SELECTED with unavailable entry', () => {
    const scope = buildAdminBranchScope([L1], new Map());
    expect(scope.mode).toBe('SELECTED');
    expect(scope.branches[0]).toMatchObject({
      locationId: L1,
      available: false,
      address: null,
    });
  });

  it('6 — foreign id not in business map → unavailable (no leakage)', () => {
    const map = new Map([[L1, loc(L1, 'A', true)]]);
    const scope = buildAdminBranchScope([FOREIGN], map);
    expect(scope.branches[0]?.available).toBe(false);
    expect(scope.branches[0]?.address).toBeNull();
  });

  it('groups assignment rows by entity', () => {
    const grouped = groupAssignmentLocationIds(
      [
        { entityId: 'i1', locationId: L2 },
        { entityId: 'i1', locationId: L1 },
        { entityId: 'i2', locationId: L1 },
      ],
      (r) => r.entityId,
      (r) => r.locationId,
    );
    expect(grouped.get('i1')?.sort()).toEqual([L1, L2]);
    expect(grouped.get('i2')).toEqual([L1]);
  });
});
