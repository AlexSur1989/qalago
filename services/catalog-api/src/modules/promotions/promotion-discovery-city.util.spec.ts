import { pickSelectedPromotionContextLocation } from './promotion-discovery-city.util';

describe('promotion-discovery-city.util', () => {
  const d = (ms: number) => new Date(ms);

  it('pickSelectedPromotionContextLocation prefers assigned primary in city', () => {
    const id = pickSelectedPromotionContextLocation([
      { id: 'l-non-primary', cityId: 'c1', isPrimary: false, createdAt: d(1) },
      { id: 'l-primary', cityId: 'c1', isPrimary: true, createdAt: d(99) },
    ]);
    expect(id).toBe('l-primary');
  });

  it('pickSelectedPromotionContextLocation uses createdAt then id when no primary', () => {
    const id = pickSelectedPromotionContextLocation([
      { id: 'b', cityId: 'c1', isPrimary: false, createdAt: d(2) },
      { id: 'a', cityId: 'c1', isPrimary: false, createdAt: d(2) },
    ]);
    expect(id).toBe('a');
  });

  it('returns null when no assigned branch in city', () => {
    expect(pickSelectedPromotionContextLocation([])).toBeNull();
  });
});
