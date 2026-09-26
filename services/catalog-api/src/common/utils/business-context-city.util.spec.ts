import {
  businessHasLocationInCityWhere,
  resolveBusinessAuditCityId,
} from './business-context-city.util';

describe('business-context-city (A.9.4.5C)', () => {
  it('resolveBusinessAuditCityId prefers explicit city', async () => {
    const db = { businessLocation: { findMany: jest.fn() } };
    await expect(
      resolveBusinessAuditCityId(db as never, 'biz-1', 'city-explicit'),
    ).resolves.toBe('city-explicit');
    expect(db.businessLocation.findMany).not.toHaveBeenCalled();
  });

  it('businessHasLocationInCityWhere uses BL presence not parent cityId', () => {
    expect(businessHasLocationInCityWhere('city-b')).toEqual({
      locations: { some: { cityId: 'city-b' } },
    });
  });

  it('resolveBusinessAuditCityId falls back to primary BL (stale parent mirror ignored)', async () => {
    const db = {
      businessLocation: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'l1', cityId: 'city-a', isPrimary: false, createdAt: new Date(1) },
          { id: 'l2', cityId: 'city-b', isPrimary: true, createdAt: new Date(2) },
        ]),
      },
    };
    await expect(resolveBusinessAuditCityId(db as never, 'biz-1')).resolves.toBe('city-b');
  });
});
