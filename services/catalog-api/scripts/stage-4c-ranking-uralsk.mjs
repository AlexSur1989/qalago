import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function legacyTierRank(planTier, planExpiresAt) {
  const now = new Date();
  const paid =
    (planTier === 'PRO' || planTier === 'TOP_CITY') &&
    planExpiresAt != null &&
    planExpiresAt >= now;
  if (planTier === 'TOP_CITY' && paid) return 2;
  if (planTier === 'PRO' && paid) return 1;
  return 0;
}

async function main() {
  const businesses = await prisma.business.findMany({
    where: { status: 'ACTIVE', city: { slug: 'uralsk' } },
    select: { title: true, planTier: true, planExpiresAt: true },
    orderBy: { title: 'asc' },
  });

  const legacy = [...businesses].sort((a, b) => {
    const diff =
      legacyTierRank(b.planTier, b.planExpiresAt) -
      legacyTierRank(a.planTier, a.planExpiresAt);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, 'ru');
  });

  console.log(
    JSON.stringify(
      {
        titleSort: businesses.map((b) => `${b.title} (${b.planTier})`),
        legacySort: legacy.map((b) => `${b.title} (${b.planTier})`),
      },
      null,
      2,
    ),
  );
}

main().finally(() => prisma.$disconnect());
