const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const businessesWithOwner = await prisma.business.count({
    where: { ownerId: { not: null } },
  });
  const activeOwnerMemberships = await prisma.businessMembership.count({
    where: { role: 'OWNER', status: 'ACTIVE' },
  });
  const nullOwnerBusinesses = await prisma.business.count({
    where: { ownerId: null },
  });
  const duplicates = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM (
      SELECT "userId", "businessId", COUNT(*) AS n
      FROM "BusinessMembership"
      GROUP BY 1, 2
      HAVING COUNT(*) > 1
    ) d`;
  console.log({
    businessesWithOwner,
    activeOwnerMemberships,
    nullOwnerBusinesses,
    duplicatePairs: duplicates[0]?.c ?? 0,
  });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
