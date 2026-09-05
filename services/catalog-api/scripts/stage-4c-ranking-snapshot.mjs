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

function legacySort(items) {
  return [...items].sort((a, b) => {
    const diff =
      legacyTierRank(b.planTier, b.planExpiresAt) -
      legacyTierRank(a.planTier, a.planExpiresAt);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, 'ru');
  });
}

function newSort(items) {
  return [...items].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

async function main() {
  const category = await prisma.category.findFirst({ where: { slug: 'fitness' } });
  if (!category) {
    console.log('No food category');
    return;
  }

  const businesses = await prisma.business.findMany({
    where: { categoryId: category.id, status: 'ACTIVE' },
    select: { title: true, planTier: true, planExpiresAt: true },
  });

  console.log(
    JSON.stringify(
      {
        category: 'fitness',
        legacyOrder: legacySort(businesses).map((b) => ({
          title: b.title,
          planTier: b.planTier,
        })),
        newOrder: newSort(businesses).map((b) => ({
          title: b.title,
          planTier: b.planTier,
        })),
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
