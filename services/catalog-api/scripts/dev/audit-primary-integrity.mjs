/**
 * READ-ONLY primary integrity audit (Stage 6.12A.9.1 / A.9.4.2A counts).
 * No INSERT/UPDATE/DELETE. Exit 0 = PASS, 1 = FAIL or error.
 * For repair planning use: node scripts/dev/business-location-integrity.mjs
 *
 * Usage (from services/catalog-api):
 *   node scripts/dev/audit-primary-integrity.mjs
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
require('dotenv').config({ path: join(root, '.env') });
require('ts-node/register/transpile-only');

const { PrismaClient } = require('@prisma/client');
const {
  collectPrimaryIntegrityReport,
  formatPrimaryIntegrityReport,
} = require('../../src/common/utils/business-primary-integrity-audit.util.ts');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured — aborting read-only audit.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const report = await collectPrimaryIntegrityReport(prisma);
    console.log(formatPrimaryIntegrityReport(report));
    process.exit(report.pass ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
