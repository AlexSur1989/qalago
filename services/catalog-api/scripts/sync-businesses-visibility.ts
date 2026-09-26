import { BusinessStatus, PrismaClient } from '@prisma/client';
import {
  assertVisibilitySyncBusinessUpdateData,
  planVisibilitySyncUpdates,
  type VisibilitySyncCityRow,
} from '../src/scripts/sync-businesses-visibility.util';

const prisma = new PrismaClient();

/**
 * Dev helper: makes non-ACTIVE businesses appear in the public catalog (status → ACTIVE).
 * Does NOT write Business or BusinessLocation physical geo (A.9.4.4A).
 * Use explicit BusinessLocation repair/import flows for coordinates.
 */
async function main() {
  const cities = await prisma.city.findMany({
    select: { id: true, slug: true, nameRu: true },
  });
  const cityById = new Map<string, VisibilitySyncCityRow>(
    cities.map((c) => [c.id, c]),
  );

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const primaries = await prisma.businessLocation.findMany({
    where: { isPrimary: true, businessId: { in: businesses.map((b) => b.id) } },
    select: { businessId: true, cityId: true },
  });
  const primaryCityByBusiness = new Map(primaries.map((p) => [p.businessId, p.cityId]));

  const plan = planVisibilitySyncUpdates(
    businesses.map((b) => ({
      ...b,
      primaryCityId: primaryCityByBusiness.get(b.id) ?? null,
    })),
    cityById,
  );

  for (const slug of plan.skippedUnknownCitySlugs) {
    console.warn(`SKIP ${slug}: unknown primary city`);
  }

  for (const item of plan.updates) {
    assertVisibilitySyncBusinessUpdateData(item.data);
    console.log(item.logLine);
    await prisma.business.update({
      where: { id: item.businessId },
      data: item.data,
    });
  }

  console.log('\n=== Summary ===');
  for (const city of cities) {
    const scopedBusinessIds = await prisma.businessLocation.findMany({
      where: { cityId: city.id },
      select: { businessId: true },
      distinct: ['businessId'],
    });
    const ids = scopedBusinessIds.map((r) => r.businessId);
    if (ids.length === 0) {
      console.log(`${city.slug} (${city.nameRu}): no businesses | public ACTIVE=0`);
      continue;
    }
    const rows = await prisma.business.groupBy({
      by: ['status'],
      where: { id: { in: ids } },
      _count: true,
    });
    const parts = rows.map((r) => `${r.status}=${r._count}`).join(', ');
    const publicCount = await prisma.business.count({
      where: { id: { in: ids }, status: BusinessStatus.ACTIVE },
    });
    console.log(
      `${city.slug} (${city.nameRu}): ${parts || 'no businesses'} | public ACTIVE=${publicCount}`,
    );
  }
  console.log(`Activated: ${plan.activated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
