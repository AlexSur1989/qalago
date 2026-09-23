import {
  compareDeterministicSearchContextBranch,
  evaluateServiceItemSearchBranchAvailabilityInCity,
  pickDeterministicSearchContextBranch,
} from './business-catalog-search-branch.util';

describe('business-catalog-search-branch.util', () => {
  const d = (ms: number) => new Date(ms);

  it('pickDeterministicSearchContextBranch prefers primary then createdAt then id', () => {
    const picked = pickDeterministicSearchContextBranch([
      { id: 'z', isPrimary: false, createdAt: d(1) },
      { id: 'a', isPrimary: true, createdAt: d(99) },
      { id: 'm', isPrimary: false, createdAt: d(0) },
    ]);
    expect(picked?.id).toBe('a');
  });

  it('compareDeterministicSearchContextBranch is stable', () => {
    const a = { id: 'b', isPrimary: false, createdAt: d(1) };
    const b = { id: 'a', isPrimary: false, createdAt: d(1) };
    expect(compareDeterministicSearchContextBranch(a, b)).toBeGreaterThan(0);
  });

  it('SELECTED: no assignment in city → ineligible', () => {
    const result = evaluateServiceItemSearchBranchAvailabilityInCity(
      [
        {
          locationId: 'l-oral',
          branchLocation: {
            id: 'l-oral',
            cityId: 'city-oral',
            isPrimary: true,
            createdAt: d(1),
          },
        },
      ],
      'city-aktobe',
    );
    expect(result.eligible).toBe(false);
  });

  it('ALL: zero SIBA rows → eligible without selected context', () => {
    const result = evaluateServiceItemSearchBranchAvailabilityInCity([], 'city-oral');
    expect(result.eligible).toBe(true);
    expect(result.selectedContextLocation).toBeNull();
  });

  it('SELECTED: assignment in city → eligible with deterministic context', () => {
    const result = evaluateServiceItemSearchBranchAvailabilityInCity(
      [
        {
          locationId: 'l2',
          branchLocation: {
            id: 'l2',
            cityId: 'city-aktobe',
            isPrimary: false,
            createdAt: d(2),
          },
        },
      ],
      'city-aktobe',
    );
    expect(result.eligible).toBe(true);
    expect(result.selectedContextLocation?.id).toBe('l2');
  });
});
