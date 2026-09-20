import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT r.id, r."userId", r."businessId", r.rating, b."ownerId", b.title AS "businessTitle"
    FROM "Review" r
    JOIN "Business" b ON b.id = r."businessId"
    WHERE (
        b."ownerId" = r."userId"
        OR EXISTS (
          SELECT 1 FROM "BusinessMembership" m
          WHERE m."userId" = r."userId"
            AND m."businessId" = r."businessId"
            AND m.status = 'ACTIVE'
            AND m.role IN ('OWNER', 'MANAGER')
        )
      )
  `;
  console.log(JSON.stringify({ selfReviewMatches: rows, count: rows.length }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
