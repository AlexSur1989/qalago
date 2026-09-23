import { resolveCityContextLocationIds } from './business-discovery-city-context.util';

describe('business-discovery-city-context.util (A.7.9.3A)', () => {
  it('resolveCityContextLocationIds picks first row per business after stable order', async () => {
    const prisma = {
      businessLocation: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'l-primary', businessId: 'b1', isPrimary: true, createdAt: new Date(1) },
          { id: 'l2', businessId: 'b2', isPrimary: false, createdAt: new Date(2) },
        ]),
      },
    };

    const map = await resolveCityContextLocationIds(prisma as never, 'city-c', ['b1', 'b2']);
    expect(map.get('b1')).toBe('l-primary');
    expect(map.get('b2')).toBe('l2');
    expect(prisma.businessLocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: { in: ['b1', 'b2'] }, cityId: 'city-c' },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('returns empty map for no ids', async () => {
    const prisma = { businessLocation: { findMany: jest.fn() } };
    const map = await resolveCityContextLocationIds(prisma as never, 'city-c', []);
    expect(map.size).toBe(0);
    expect(prisma.businessLocation.findMany).not.toHaveBeenCalled();
  });
});
