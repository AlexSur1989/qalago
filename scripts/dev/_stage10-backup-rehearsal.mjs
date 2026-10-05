/**
 * Stage 10 — isolated backup/restore rehearsal (Persona A template).
 * Read-only pg_dump on source DB; creates/restores TARGET_DB (default qalago_stage10_restore).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const envPath = join(repoRoot, 'services', 'catalog-api', '.env');
const TARGET_DB = process.env.STAGE10_TARGET_DB ?? 'qalago_stage10_restore';
const PG_ADMIN_USER = process.env.STAGE10_PG_ADMIN_USER ?? 'postgres';

const PG_BIN =
  process.env.PG_BIN ?? 'C:\\Program Files\\PostgreSQL\\18\\bin';

function pgTool(name) {
  return join(PG_BIN, `${name}.exe`);
}

function loadDatabaseUrl() {
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== 'DATABASE_URL') continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    return val;
  }
  throw new Error('DATABASE_URL not set in catalog-api .env');
}

function parsePgUrl(urlString) {
  const u = new URL(urlString);
  return {
    host: u.hostname,
    port: u.port || '5432',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

function run(exe, args, env = process.env) {
  execFileSync(exe, args, { stdio: 'inherit', env });
}

function runCapture(exe, args, env = process.env) {
  return execFileSync(exe, args, { encoding: 'utf8', env }).trim();
}

function main() {
  const baseUrl = loadDatabaseUrl();
  const src = parsePgUrl(baseUrl);
  if (src.database !== 'qalago_dev') {
    console.warn(
      `[stage10] WARNING: source DB is "${src.database}", expected qalago_dev for standard rehearsal.`,
    );
  }

  const dumpDir = join(repoRoot, 'services', 'catalog-api', 'backups');
  mkdirSync(dumpDir, { recursive: true });
  const dumpFile = join(dumpDir, `stage10-from-${src.database}.dump`);

  const envApp = { ...process.env, PGPASSWORD: src.password };
  const envAdmin = { ...process.env, PGPASSWORD: process.env.STAGE10_PG_ADMIN_PASSWORD ?? '' };

  const pgDump = pgTool('pg_dump');
  const psql = pgTool('psql');
  const pgRestore = pgTool('pg_restore');
  const createdb = pgTool('createdb');
  const dropdb = pgTool('dropdb');

  console.log(`[stage10] Dump ${src.database} → ${dumpFile}`);
  run(
    pgDump,
    [
      '-Fc',
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      src.user,
      '-f',
      dumpFile,
      src.database,
    ],
    envApp,
  );

  console.log(`[stage10] Recreate ${TARGET_DB} (admin user ${PG_ADMIN_USER})`);
  try {
    run(
      dropdb,
      [
        '-h',
        src.host,
        '-p',
        src.port,
        '-U',
        PG_ADMIN_USER,
        '--if-exists',
        TARGET_DB,
      ],
      envAdmin,
    );
  } catch {
    /* ignore */
  }
  run(
    createdb,
    [
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      PG_ADMIN_USER,
      '-O',
      src.user,
      TARGET_DB,
    ],
    envAdmin,
  );

  console.log(`[stage10] Restore into ${TARGET_DB} (admin ${PG_ADMIN_USER})`);
  run(
    pgRestore,
    [
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      PG_ADMIN_USER,
      '-d',
      TARGET_DB,
      '--single-transaction',
      '--no-owner',
      '--no-acl',
      dumpFile,
    ],
    envAdmin,
  );

  console.log(`[stage10] Grants for app role ${src.user}`);
  run(
    psql,
    [
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      PG_ADMIN_USER,
      '-d',
      TARGET_DB,
      '-c',
      `GRANT ALL ON SCHEMA public TO ${src.user}; GRANT ALL ON ALL TABLES IN SCHEMA public TO ${src.user}; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${src.user};`,
    ],
    envAdmin,
  );

  const migrationCount = runCapture(
    psql,
    [
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      src.user,
      '-d',
      TARGET_DB,
      '-tAc',
      'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;',
    ],
    envApp,
  );

  const pendingCount = runCapture(
    psql,
    [
      '-h',
      src.host,
      '-p',
      src.port,
      '-U',
      src.user,
      '-d',
      TARGET_DB,
      '-tAc',
      'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL;',
    ],
    envApp,
  );

  console.log(
    `[stage10] PASS — applied migration rows on ${TARGET_DB}: ${migrationCount} (unfinished: ${pendingCount})`,
  );
  console.log(
    `[stage10] Optional: DATABASE_URL=…/${TARGET_DB} npx prisma migrate status (catalog-api cwd)`,
  );
  console.log(`[stage10] Dump kept at ${dumpFile} (gitignored backups dir)`);
}

try {
  main();
} catch (err) {
  console.error('[stage10] FAIL', err.message ?? err);
  process.exit(1);
}
