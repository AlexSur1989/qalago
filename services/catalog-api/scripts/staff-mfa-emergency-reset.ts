/**
 * Break-glass MFA reset — run on production host with DB access only.
 * Usage (from services/catalog-api):
 *   BREAK_GLASS_CONFIRM=I_UNDERSTAND_STAFF_MFA_RESET npm run staff:mfa:emergency-reset -- --userId=<cuid>|--phone=+770...
 */
import { PrismaClient, UserRole } from '@prisma/client';
async function main() {
  const confirm = process.env.BREAK_GLASS_CONFIRM?.trim();
  if (confirm !== 'I_UNDERSTAND_STAFF_MFA_RESET') {
    console.error('Set BREAK_GLASS_CONFIRM=I_UNDERSTAND_STAFF_MFA_RESET to proceed.');
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const userIdArg = args.find((a) => a.startsWith('--userId='))?.split('=')[1];
  const phoneArg = args.find((a) => a.startsWith('--phone='))?.split('=')[1];
  if (!userIdArg && !phoneArg) {
    console.error('Provide --userId= or --phone=');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const user = userIdArg
    ? await prisma.user.findUnique({ where: { id: userIdArg } })
    : await prisma.user.findUnique({ where: { phone: phoneArg! } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    console.error('Target must be staff (use staff user id)');
    process.exit(1);
  }
  console.log(`Emergency MFA reset for user ${user.id} (${user.phone ?? 'no phone'})`);
  // Minimal standalone reset without Nest DI — direct DB + audit
  await prisma.staffMfaRecoveryCode.deleteMany({ where: { userId: user.id } });
  await prisma.staffMfaCredential.deleteMany({ where: { userId: user.id } });
  await prisma.staffAccess.updateMany({
    where: { userId: user.id },
    data: { mfaEnrolledAt: null, mfaRequired: false },
  });
  await prisma.authSession.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      action: 'STAFF_MFA_EMERGENCY_RESET',
      resourceType: 'USER',
      resourceId: user.id,
      targetUserId: user.id,
      metadata: { via: 'cli' },
    },
  });
  console.log('Done. All sessions revoked; MFA removed; user must re-enroll on next login.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
