import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    users,
    businesses,
    businessesWithOwner,
    membershipsTotal,
    activeOwner,
    activeManager,
    otherMembership,
    missingOwnerMembership,
    duplicateMembership,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.business.count({ where: { ownerId: { not: null } } }),
    prisma.businessMembership.count(),
    prisma.businessMembership.count({
      where: { role: 'OWNER', status: 'ACTIVE' },
    }),
    prisma.businessMembership.count({
      where: { role: 'MANAGER', status: 'ACTIVE' },
    }),
    prisma.businessMembership.count({
      where: {
        OR: [
          { status: { not: 'ACTIVE' } },
          { role: { notIn: ['OWNER', 'MANAGER'] } },
        ],
      },
    }),
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Business" b
      WHERE b."ownerId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "BusinessMembership" m
          WHERE m."businessId" = b.id
            AND m."userId" = b."ownerId"
            AND m.role = 'OWNER'
            AND m.status = 'ACTIVE'
        )
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId", "businessId", COUNT(*) AS c
        FROM "BusinessMembership"
        GROUP BY "userId", "businessId"
        HAVING COUNT(*) > 1
      ) d
    `,
  ]);

  console.log(
    JSON.stringify(
      {
        users,
        businesses,
        businessesWithOwner,
        membershipsTotal,
        activeOwner,
        activeManager,
        otherMembership,
        missingOwnerMembership: missingOwnerMembership[0]?.count ?? 0,
        duplicateMembership: duplicateMembership[0]?.count ?? 0,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
