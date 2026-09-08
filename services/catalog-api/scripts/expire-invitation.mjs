import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invitation = await prisma.businessInvitation.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!invitation) {
    console.log(JSON.stringify({ skipped: true, reason: 'no pending invitation' }));
    return;
  }
  await prisma.businessInvitation.update({
    where: { id: invitation.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  console.log(JSON.stringify({ expiredInvitationId: invitation.id, phone: '[redacted]' }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
