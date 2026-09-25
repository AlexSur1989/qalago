/**
 * BusinessLocation integrity audit & optional repair (Stage 6.12A.9.4.2A).
 *
 * Default: DRY_RUN (read-only plan, no mutations).
 *
 * Usage (from services/catalog-api):
 *   node scripts/dev/business-location-integrity.mjs
 *   node scripts/dev/business-location-integrity.mjs --audit-only
 *   node scripts/dev/business-location-integrity.mjs --apply
 *
 * Exit codes:
 *   0 — integrity valid OR apply finished with no unresolved violations
 *   1 — violations/manual/failures remain OR runtime error
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
  runBusinessLocationIntegrity,
  formatBusinessLocationIntegritySummary,
  businessLocationIntegrityExitCode,
} = require('../../src/common/utils/business-location-integrity-repair.util.ts');

function parseMode(argv) {
  if (argv.includes('--apply')) {
    return 'APPLY';
  }
  if (argv.includes('--audit-only')) {
    return 'AUDIT_ONLY';
  }
  return 'DRY_RUN';
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured — aborting.');
    process.exit(1);
  }

  const mode = parseMode(process.argv.slice(2));

  const prisma = new PrismaClient();
  try {
    const summary = await runBusinessLocationIntegrity(prisma, mode);
    console.log(
      formatBusinessLocationIntegritySummary(summary, {
        concise: mode === 'AUDIT_ONLY',
      }),
    );
    process.exit(businessLocationIntegrityExitCode(summary));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
