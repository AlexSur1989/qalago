import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { runBusinessLocationIntegrity } from '../../common/utils/business-location-integrity-repair.util';
import { collectBusinessLocationBlHygieneReport } from '../../common/utils/business-location-bl-hygiene-audit.util';

describe('Stage 6.12A.9.4.4C2 — BusinessLocation-native integrity', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let uralskCityId = '';
  let categoryId = '';
  let ownerId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !category || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        categoryId = category.id;
        ownerId = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createSlug(prefix: string) {
    return `${prefix}-${randomBytes(5).toString('hex')}`;
  }

  it('stale Business geo vs primary BL does not fail integrity audit', async () => {
    if (skip) return;
    const slug = await createSlug('c2-stale-geo');
    const business = await prisma.business.create({
      data: {
        title: 'C2 stale geo drift',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Legacy business address only',
        ownerId,
        status: 'PENDING',
        latitude: 51.1,
        longitude: 51.2,
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Authoritative BL address',
        isPrimary: true,
        latitude: 51.2278,
        longitude: 51.3865,
      },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'AUDIT_ONLY');
      expect(summary.items.find((i) => i.businessId === business.id)).toBeUndefined();
      const primaries = await prisma.businessLocation.count({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primaries).toBe(1);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('reports parent city mismatch separately from BL hygiene', async () => {
    if (skip) return;
    const otherCity = await prisma.city.findFirst({
      where: { NOT: { id: uralskCityId } },
      select: { id: true },
    });
    if (!otherCity) return;

    const slug = await createSlug('c2-city-mismatch');
    const business = await prisma.business.create({
      data: {
        title: 'C2 city mismatch',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Addr',
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: otherCity.id,
        address: 'Branch addr',
        isPrimary: true,
      },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'AUDIT_ONLY');
      expect(summary.parentCityMirrorMismatchCount).toBeGreaterThanOrEqual(1);
      expect(summary.pass).toBe(false);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('detects empty BL address in hygiene report', async () => {
    if (skip) return;
    const slug = await createSlug('c2-empty-bl-addr');
    const business = await prisma.business.create({
      data: {
        title: 'C2 empty BL address',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Parent addr',
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: '   ',
        isPrimary: true,
      },
    });

    try {
      const hygiene = await collectBusinessLocationBlHygieneReport(prisma);
      expect(hygiene.emptyBlAddressCount).toBeGreaterThanOrEqual(1);
      expect(hygiene.pass).toBe(false);
      const summary = await runBusinessLocationIntegrity(prisma, 'AUDIT_ONLY');
      expect(summary.blHygiene.pass).toBe(false);
      expect(summary.pass).toBe(false);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('detects partial coordinate pair on BusinessLocation', async () => {
    if (skip) return;
    const slug = await createSlug('c2-partial-coords');
    const business = await prisma.business.create({
      data: {
        title: 'C2 partial coords',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Addr',
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Partial',
        isPrimary: true,
        latitude: 51.2,
        longitude: null,
      },
    });

    try {
      const hygiene = await collectBusinessLocationBlHygieneReport(prisma);
      expect(hygiene.partialCoordinatePairCount).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
