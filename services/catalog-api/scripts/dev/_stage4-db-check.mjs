import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const col = await prisma.$queryRaw`
    SELECT current_database()::text AS db,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AuthSession' AND column_name = 'mfaEnrollOnly'
      ) AS has_mfa_enroll_only`;
  console.log('column_check', JSON.stringify(col));

  const authMig = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE migration_name LIKE ${'%auth_session%'}
    ORDER BY finished_at DESC NULLS LAST
    LIMIT 5`;
  console.log('auth_migrations', JSON.stringify(authMig));

  const pending = await prisma.$queryRaw`
    SELECT migration_name FROM _prisma_migrations
    WHERE finished_at IS NULL LIMIT 10`;
  console.log('unfinished', JSON.stringify(pending));
} finally {
  await prisma.$disconnect();
}
