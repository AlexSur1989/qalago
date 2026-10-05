import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const enums = await prisma.$queryRaw`
    SELECT e.enumlabel AS label
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LegalDocumentType'
    ORDER BY e.enumsortorder`;
  console.log('LegalDocumentType', JSON.stringify(enums.map((r) => r.label)));

  const mig = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE migration_name LIKE ${'%6_15l2%legal%'}
    ORDER BY migration_name`;
  console.log('legal_migrations', JSON.stringify(mig));
} finally {
  await prisma.$disconnect();
}
