/**
 * One-shot production bootstrap for the first SUPER_ADMIN.
 *
 * Usage (after `prisma migrate deploy`):
 *   BOOTSTRAP_SUPER_ADMIN_PHONE=+7701XXXXXXX npm run bootstrap:super-admin
 *
 * Optional: BOOTSTRAP_SUPER_ADMIN_EMAIL is reserved for future identity lookup (not auto-elevation).
 *
 * Never run `npm run seed` in production — it creates known QA users and demo data.
 */
import {
  AuditAction,
  AuditResourceType,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { normalizeKazakhstanPhone } from '../src/modules/auth/auth-phone.util';

const KNOWN_QA_PHONES = new Set([
  '+77000000001',
  '+77000000002',
  '+77000000003',
  '+77000000004',
  '+77000000005',
]);

async function main() {
  const rawPhone = process.env.BOOTSTRAP_SUPER_ADMIN_PHONE?.trim();
  if (!rawPhone) {
    console.error(
      'BOOTSTRAP_SUPER_ADMIN_PHONE is required. Example: BOOTSTRAP_SUPER_ADMIN_PHONE=+7701XXXXXXX npm run bootstrap:super-admin',
    );
    process.exit(1);
  }

  const phone = normalizeKazakhstanPhone(rawPhone);
  if (!phone) {
    console.error('BOOTSTRAP_SUPER_ADMIN_PHONE is not a valid Kazakhstan phone number.');
    process.exit(1);
  }

  if (KNOWN_QA_PHONES.has(phone)) {
    console.error(
      'Refusing to bootstrap SUPER_ADMIN with a known QA/dev seed phone. Use a real operator phone.',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existingSuperAdmins = await prisma.staffAccess.count({
      where: { staffRole: UserRole.SUPER_ADMIN, isActive: true },
    });

    const user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      const staff = await prisma.staffAccess.findUnique({ where: { userId: user.id } });
      if (
        staff?.staffRole === UserRole.SUPER_ADMIN &&
        staff.isActive &&
        user.role === UserRole.SUPER_ADMIN
      ) {
        console.log(`SUPER_ADMIN already exists for phone ending ${phone.slice(-4)}. No changes.`);
        return;
      }
    }

    if (existingSuperAdmins > 0) {
      console.error(
        'An active SUPER_ADMIN already exists. Bootstrap another SUPER_ADMIN only via admin governance.',
      );
      process.exit(1);
    }

    const userId = user
      ? (
          await prisma.user.update({
            where: { id: user.id },
            data: {
              role: UserRole.SUPER_ADMIN,
              isActive: true,
              name: user.name ?? 'Super Admin',
            },
          })
        ).id
      : (
          await prisma.user.create({
            data: {
              phone,
              role: UserRole.SUPER_ADMIN,
              name: process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || 'Super Admin',
            },
          })
        ).id;

    await prisma.staffAccess.upsert({
      where: { userId },
      create: {
        userId,
        staffRole: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      update: {
        staffRole: UserRole.SUPER_ADMIN,
        isActive: true,
        disabledAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.STAFF_BOOTSTRAP,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: userId,
        targetUserId: userId,
        metadata: { staffRole: UserRole.SUPER_ADMIN, via: 'bootstrap-cli' },
      },
    });

    console.log(
      user
        ? `Promoted existing user to SUPER_ADMIN (phone ending ${phone.slice(-4)}).`
        : `Created SUPER_ADMIN (phone ending ${phone.slice(-4)}). Sign in via OTP in admin panel.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
