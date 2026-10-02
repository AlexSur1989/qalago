import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN_IN_CLIENT_SOURCES = [
  'JWT_SECRET',
  'QALAGO_INTERNAL_SERVICE_TOKEN',
  'STAFF_MFA_ENCRYPTION_KEY',
  'FIREBASE_PRIVATE_KEY',
  'DATABASE_URL',
  'S3_SECRET_ACCESS_KEY',
  'S3_ACCESS_KEY',
] as const;

const CLIENT_SCAN_DIRS = ['lib', 'app', 'components'] as const;

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('PROD.2 client bundle secret guard (consumer-web)', () => {
  it('does not reference server-only secret env names in client source', () => {
    const violations: string[] = [];
    for (const sub of CLIENT_SCAN_DIRS) {
      for (const file of listSourceFiles(path.join(rootDir, sub))) {
        const text = fs.readFileSync(file, 'utf8');
        for (const name of FORBIDDEN_IN_CLIENT_SOURCES) {
          if (text.includes(name)) {
            violations.push(`${path.relative(rootDir, file)}: ${name}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
