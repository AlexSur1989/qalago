import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.groupBy({ by: ['role'], _count: true });
  const bizStatus = await prisma.business.groupBy({ by: ['status'], _count: true });
  const ownerNull = await prisma.business.count({ where: { ownerId: null } });
  const ownerNonNull = await prisma.business.count({ where: { ownerId: { not: null } } });
  const mem = await prisma.businessMembership.groupBy({ by: ['role', 'status'], _count: true });
  const apps = await prisma.businessApplication.groupBy({ by: ['status'], _count: true });
  const claims = await prisma.businessOwnershipClaim.groupBy({ by: ['status'], _count: true });

  const businesses = await prisma.business.findMany({ select: { id: true } });
  let zeroOwner = 0;
  let multiOwner = 0;
  for (const b of businesses) {
    const c = await prisma.businessMembership.count({
      where: { businessId: b.id, role: 'OWNER', status: 'ACTIVE' },
    });
    if (c === 0) zeroOwner++;
    if (c > 1) multiOwner++;
  }

  const businessUsers = await prisma.user.findMany({
    where: { role: UserRole.BUSINESS },
    select: { id: true },
  });
  let buOwner = 0;
  let buMgr = 0;
  let buNeither = 0;
  for (const u of businessUsers) {
    const o = await prisma.businessMembership.count({
      where: { userId: u.id, role: 'OWNER', status: 'ACTIVE' },
    });
    const m = await prisma.businessMembership.count({
      where: { userId: u.id, role: 'MANAGER', status: 'ACTIVE' },
    });
    if (o > 0) buOwner++;
    else if (m > 0) buMgr++;
    else buNeither++;
  }

  console.log(
    JSON.stringify(
      {
        users,
        bizStatus,
        ownerNull,
        ownerNonNull,
        mem,
        apps,
        claims,
        zeroOwnerBusinesses: zeroOwner,
        multiOwnerBusinesses: multiOwner,
        businessUserCount: businessUsers.length,
        businessUsersWithActiveOwner: buOwner,
        businessUsersWithActiveManager: buMgr,
        businessUsersWithNeither: buNeither,
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
