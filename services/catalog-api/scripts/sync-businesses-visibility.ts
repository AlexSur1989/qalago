import { BusinessStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Makes admin-visible businesses appear in the public catalog:
 * - PENDING / BLOCKED (except explicitly blocked) -> ACTIVE
 * - Missing coordinates -> city center (so geo radius still finds them)
 */
async function main() {
  const cities = await prisma.city.findMany({
    select: { id: true, slug: true, nameRu: true, centerLat: true, centerLng: true },
  });
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      cityId: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let activated = 0;
  let geocoded = 0;

  for (const business of businesses) {
    const city = cityById.get(business.cityId);
    if (!city) {
      console.warn(`SKIP ${business.slug}: unknown cityId ${business.cityId}`);
      continue;
    }

    const updates: {
      status?: BusinessStatus;
      latitude?: number;
      longitude?: number;
    } = {};

    if (business.status !== BusinessStatus.ACTIVE) {
      updates.status = BusinessStatus.ACTIVE;
      activated += 1;
      console.log(
        `[${city.slug}] ACTIVE: ${business.title} (was ${business.status})`,
      );
    }

    if (
      (business.latitude == null || business.longitude == null) &&
      city.centerLat != null &&
      city.centerLng != null
    ) {
      updates.latitude = Number(city.centerLat);
      updates.longitude = Number(city.centerLng);
      geocoded += 1;
      console.log(`[${city.slug}] GEO: ${business.title} -> city center`);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.business.update({
        where: { id: business.id },
        data: updates,
      });
    }
  }

  console.log('\n=== Summary ===');
  for (const city of cities) {
    const rows = await prisma.business.groupBy({
      by: ['status'],
      where: { cityId: city.id },
      _count: true,
    });
    const parts = rows.map((r) => `${r.status}=${r._count}`).join(', ');
    const publicCount = await prisma.business.count({
      where: { cityId: city.id, status: BusinessStatus.ACTIVE },
    });
    console.log(
      `${city.slug} (${city.nameRu}): ${parts || 'no businesses'} | public ACTIVE=${publicCount}`,
    );
  }
  console.log(`Activated: ${activated}, geocoded: ${geocoded}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
