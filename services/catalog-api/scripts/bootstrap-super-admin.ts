/**
 * One-shot production bootstrap for the first SUPER_ADMIN.
 *
 * Usage (after `prisma migrate deploy`):
 *   BOOTSTRAP_SUPER_ADMIN_PHONE=+7701XXXXXXX npm run bootstrap:super-admin
 *
 * Never run `npm run seed` in production — it creates known QA users and demo data.
 */
import { PrismaClient, UserRole } from '@prisma/client';
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
    const existingSuperAdmins = await prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN, isActive: true },
    });

    const user = await prisma.user.findUnique({ where: { phone } });

    if (user?.role === UserRole.SUPER_ADMIN && user.isActive) {
      console.log(`SUPER_ADMIN already exists for phone ending ${phone.slice(-4)}. No changes.`);
      return;
    }

    if (existingSuperAdmins > 0 && user?.role !== UserRole.SUPER_ADMIN) {
      console.error(
        'An active SUPER_ADMIN already exists. Bootstrap another SUPER_ADMIN only via admin governance.',
      );
      process.exit(1);
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          name: user.name ?? 'Super Admin',
        },
      });
      console.log(`Promoted existing user to SUPER_ADMIN (phone ending ${phone.slice(-4)}).`);
      return;
    }

    await prisma.user.create({
      data: {
        phone,
        role: UserRole.SUPER_ADMIN,
        name: process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || 'Super Admin',
      },
    });
    console.log(`Created SUPER_ADMIN (phone ending ${phone.slice(-4)}). Sign in via OTP in admin panel.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
