/**
 * Stage 5N.QA — DEV fixture audit (aggregate, no PII beyond phone/role).
 * Usage: node scripts/stage-5n-qa-fixtures.mjs
 */
import { PrismaClient } from '@prisma/client';

const PHONES = [
  '+77000000001',
  '+77000000002',
  '+77000000003',
  '+77000000004',
  '+77000000005',
  '+77000000093',
  '+77000000094',
];

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { phone: { in: PHONES } },
    select: {
      id: true,
      phone: true,
      name: true,
      role: true,
    },
    orderBy: { phone: 'asc' },
  });

  const report = [];

  for (const u of users) {
    const memberships = await prisma.businessMembership.findMany({
      where: { userId: u.id, status: 'ACTIVE' },
      include: {
        business: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            city: { select: { slug: true, nameRu: true } },
          },
        },
      },
    });

    report.push({
      phone: u.phone,
      name: u.name,
      role: u.role,
      activeMemberships: memberships.map((m) => ({
        businessId: m.businessId,
        businessTitle: m.business.title,
        businessSlug: m.business.slug,
        businessStatus: m.business.status,
        city: m.business.city?.slug,
        membershipRole: m.role,
        permissions: m.role === 'OWNER' ? ['ALL'] : m.permissions,
      })),
    });
  }

  const zeroOwner = await prisma.business.count({
    where: {
      status: 'ACTIVE',
      ownerId: null,
      memberships: { none: { role: 'OWNER', status: 'ACTIVE' } },
    },
  });

  console.log(JSON.stringify({ users: report, zeroOwnerActiveBusinesses: zeroOwner }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
