#!/usr/bin/env node
/**
 * Mark every migration folder as applied (migrate resolve --applied).
 * Use ONLY on isolated DBs after intentional baseline (e.g. db push snapshot).
 * Requires DATABASE_URL in environment. Does not run SQL.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDir = path.join(root, 'prisma/migrations');
const names = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

console.log(`Marking ${names.length} migrations as applied...`);
for (const name of names) {
  execSync(`npx prisma migrate resolve --applied ${name}`, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}
console.log('Done.');
