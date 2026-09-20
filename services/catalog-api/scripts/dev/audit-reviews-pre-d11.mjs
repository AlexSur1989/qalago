/**
 * Pre-migration review integrity audit (Stage 6.11D.1).
 * Read-only — reports counts only.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.review.count();

  const dupGroups = await prisma.$queryRaw`
    SELECT "userId", "businessId", COUNT(*)::int AS cnt
    FROM "Review"
    GROUP BY "userId", "businessId"
    HAVING COUNT(*) > 1
  `;

  const dupRowCount = dupGroups.reduce((s, g) => s + Number(g.cnt), 0);

  const invalidRatings = await prisma.$queryRaw`
    SELECT id, "userId", "businessId", rating
    FROM "Review"
    WHERE rating < 1 OR rating > 5
  `;

  const hiddenCount = await prisma.review.count({ where: { moderationHidden: true } });

  const businessesWithReviews = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "businessId")::int AS cnt FROM "Review"
  `;

  console.log(
    JSON.stringify(
      {
        total,
        duplicateGroups: dupGroups.length,
        duplicateRowsParticipating: dupRowCount,
        duplicateGroupsDetail: dupGroups,
        invalidRatings,
        hiddenCount,
        businessesWithReviews: businessesWithReviews[0]?.cnt ?? 0,
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
