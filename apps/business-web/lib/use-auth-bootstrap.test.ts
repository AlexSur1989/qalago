import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('useAuth bootstrap wiring (BIZ.2)', () => {
  const src = readFileSync(join(__dirname, 'use-auth.ts'), 'utf8');

  it('refresh path uses loadCanonicalBusinessUser instead of slim refresh user', () => {
    expect(src).toContain('loadCanonicalBusinessUser');
    expect(src).not.toMatch(/setUser\s*\(\s*data\.user\s*\)/);
  });

  it('does not set ready before canonical user and businesses load', () => {
    expect(src).toMatch(
      /loadCanonicalBusinessUser[\s\S]*listMyBusinesses[\s\S]*setReady\(true\)/,
    );
  });

  it('re-exports hasBusinessCabinetAccess from business-cabinet-access', () => {
    expect(src).toContain("from '@/lib/business-cabinet-access'");
  });
});
