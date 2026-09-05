import {
  assignPositions,
  fairSort,
  normalizedImpressionRatio,
  rotationTieBreakHash,
  sessionScopeKey,
  simulateRotationDistribution,
} from './ad-rotation.service';

describe('AdRotationService (pure functions)', () => {
  const scope = sessionScopeKey('HOME_FEATURED', 'city-1');

  const campaigns = [
    { id: 'c1', qualifiedImpressions: 100, weight: 1, lastTopPositionAt: null },
    { id: 'c2', qualifiedImpressions: 50, weight: 1, lastTopPositionAt: null },
    { id: 'c3', qualifiedImpressions: 200, weight: 2, lastTopPositionAt: null },
    { id: 'c4', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
    { id: 'c5', qualifiedImpressions: 10, weight: 1, lastTopPositionAt: null },
  ];

  it('1. normalizedImpressions/weight ASC ordering', () => {
    const sorted = fairSort(campaigns, 'sess-a', scope);
    expect(sorted.slice(0, 3).map((c) => c.id)).toEqual(['c4', 'c5', 'c2']);
    expect(sorted.slice(3).map((c) => c.id).sort()).toEqual(['c1', 'c3']);
  });

  it('2. higher weight lowers normalized ratio', () => {
    expect(normalizedImpressionRatio(campaigns[2]!)).toBe(100);
    expect(normalizedImpressionRatio(campaigns[1]!)).toBe(50);
  });

  it('3. tie-break is deterministic for same session+scope', () => {
    const a = rotationTieBreakHash('sess-x', 'c1', scope);
    const b = rotationTieBreakHash('sess-x', 'c1', scope);
    expect(a).toBe(b);
  });

  it('4. different sessions may change tie order', () => {
    const s1 = fairSort(
      [
        { id: 'a', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
        { id: 'b', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      ],
      'session-1',
      scope,
    );
    const s2 = fairSort(
      [
        { id: 'a', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
        { id: 'b', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      ],
      'session-2',
      scope,
    );
    expect(s1.map((c) => c.id)).toEqual(['a', 'b']);
    expect(s2.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('5. session stability — same input yields same winner', () => {
    const first = assignPositions(campaigns, 'stable-session', scope, 'HOME_FEATURED', 1);
    const second = assignPositions(campaigns, 'stable-session', scope, 'HOME_FEATURED', 1);
    expect(first[0]?.campaign.id).toBe(second[0]?.campaign.id);
  });

  it('6. maxVisible=1 returns single campaign', () => {
    const result = assignPositions(campaigns, 'sess-b', scope, 'HOME_FEATURED', 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.position).toBe(1);
  });

  it('7. simulation — 1000 sessions, 5 campaigns, maxVisible=1', () => {
    const equalPool = [
      { id: 'c1', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      { id: 'c2', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      { id: 'c3', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      { id: 'c4', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
      { id: 'c5', qualifiedImpressions: 0, weight: 1, lastTopPositionAt: null },
    ];
    const counts = simulateRotationDistribution(equalPool, 1000, scope, 1);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(1000);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(0);
    }
    const max = Math.max(...counts.values());
    const min = Math.min(...counts.values());
    expect(max / min).toBeLessThan(5);
  });

  it('8. CATEGORY_TOP position 1 — oldest lastTopPositionAt wins', () => {
    const topCampaigns = [
      {
        id: 'old',
        qualifiedImpressions: 0,
        weight: 1,
        lastTopPositionAt: new Date('2026-01-01'),
      },
      {
        id: 'new',
        qualifiedImpressions: 0,
        weight: 1,
        lastTopPositionAt: new Date('2026-09-01'),
      },
      {
        id: 'never',
        qualifiedImpressions: 0,
        weight: 1,
        lastTopPositionAt: null,
      },
    ];
    const result = assignPositions(
      topCampaigns,
      'sess-top',
      sessionScopeKey('CATEGORY_TOP', 'city-1', 'cat-1'),
      'CATEGORY_TOP',
      3,
    );
    expect(result[0]?.campaign.id).toBe('never');
    expect(result[0]?.position).toBe(1);
  });

  it('9. CATEGORY_TOP fills positions 2+ from fair sort', () => {
    const topCampaigns = [
      {
        id: 'a',
        qualifiedImpressions: 10,
        weight: 1,
        lastTopPositionAt: new Date('2026-01-01'),
      },
      {
        id: 'b',
        qualifiedImpressions: 0,
        weight: 1,
        lastTopPositionAt: new Date('2026-02-01'),
      },
    ];
    const result = assignPositions(
      topCampaigns,
      'sess-top2',
      sessionScopeKey('CATEGORY_TOP', 'city-1', 'cat-1'),
      'CATEGORY_TOP',
      2,
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.position)).toEqual([1, 2]);
  });

  it('10. empty pool returns empty assignments', () => {
    expect(assignPositions([], 's', scope, 'HOME_FEATURED', 3)).toEqual([]);
  });
});
