import { HomeSectionPlatform, HomeSectionType, PrismaClient } from '@prisma/client';

/**
 * CW.3A — live PostgreSQL invariant checks (skips when DB unavailable).
 */
describe('CW.3A HomeSectionConfig DB invariants', () => {
  const prisma = new PrismaClient();
  let skip = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.homeSectionConfig.count();
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reports indexes on HomeSectionConfig', async () => {
    if (skip) return;
    const indexes = await prisma.$queryRaw<
      { indexname: string; indexdef: string }[]
    >`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'HomeSectionConfig' ORDER BY indexname`;
    expect(indexes.length).toBeGreaterThan(0);
    // After CW.3A migration, partial uniques must exist:
    const names = indexes.map((i) => i.indexname);
    expect(names).toContain('HomeSectionConfig_global_sectionType_key');
    expect(names).toContain('HomeSectionConfig_city_sectionType_key');
  });

  it('rejects duplicate global row for same sectionType', async () => {
    if (skip) return;
    const dupId = 'cw3a-dup-global-categories-test';
    await prisma.homeSectionConfig.deleteMany({ where: { id: dupId } }).catch(() => undefined);
    await expect(
      prisma.homeSectionConfig.create({
        data: {
          id: dupId,
          sectionType: HomeSectionType.CATEGORIES,
          platform: HomeSectionPlatform.ALL,
          enabled: true,
          position: 999,
          cityId: null,
        },
      }),
    ).rejects.toThrow();
    await prisma.homeSectionConfig.deleteMany({ where: { id: dupId } }).catch(() => undefined);
  });

  it('has exactly five global seed section types', async () => {
    if (skip) return;
    const globals = await prisma.homeSectionConfig.findMany({
      where: { cityId: null },
      orderBy: { position: 'asc' },
    });
    expect(globals).toHaveLength(5);
    expect(globals.map((g) => g.sectionType)).toEqual([
      HomeSectionType.HOME_VIP_BANNER,
      HomeSectionType.CATEGORIES,
      HomeSectionType.HOME_FEATURED,
      HomeSectionType.HOME_PROMOTIONS,
      HomeSectionType.NEARBY,
    ]);
  });
});
