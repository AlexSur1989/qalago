import { PrismaClient } from '@prisma/client';

const BASE = process.env.API_BASE ?? 'http://localhost:3002/api/v1';
const PHONE = '+77000000096';

const prisma = new PrismaClient();

async function devLogin(phone) {
  const res = await fetch(`${BASE}/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

async function main() {
  const owner = await devLogin('+77000000002');
  const my = await fetch(`${BASE}/businesses/my`, {
    headers: { Authorization: `Bearer ${owner.accessToken}` },
  }).then((r) => r.json());
  const businessId = my.items.find((i) => i.business.city?.slug === 'uralsk').business.id;

  await fetch(`${BASE}/businesses/${businessId}/team/invite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${owner.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone: PHONE, permissions: ['CATALOG_EDIT'] }),
  });

  const inv = await prisma.businessInvitation.findFirst({
    where: { phone: PHONE, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!inv) throw new Error('invitation not created');

  await prisma.businessInvitation.update({
    where: { id: inv.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });

  await devLogin(PHONE);
  const user = await prisma.user.findUnique({ where: { phone: PHONE } });
  const mem = user
    ? await prisma.businessMembership.findFirst({ where: { userId: user.id, businessId } })
    : null;
  const invAfter = await prisma.businessInvitation.findUnique({ where: { id: inv.id } });

  console.log(
    JSON.stringify({
      expiredInviteNotClaimed: !mem,
      invitationStillPending: invAfter?.status === 'PENDING',
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
