import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pro = await prisma.business.findMany({
    where: { planTier: 'PRO', status: 'ACTIVE' },
    select: {
      title: true,
      planTier: true,
      category: { select: { slug: true, title: true } },
    },
  });
  console.log(JSON.stringify(pro, null, 2));
}

main().finally(() => prisma.$disconnect());
