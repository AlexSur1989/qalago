import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('useAuth bootstrap wiring (BIZ.2 + BIZ.9 HOTFIX 7B)', () => {
  const src = readFileSync(join(__dirname, 'use-auth.ts'), 'utf8');
  const bootstrapSrc = readFileSync(join(__dirname, 'business-auth-bootstrap.ts'), 'utf8');

  it('delegates session restore to shared runBusinessAuthBootstrap', () => {
    expect(src).toContain('runBusinessAuthBootstrap');
    expect(bootstrapSrc).toContain('loadCanonicalBusinessUser');
    expect(bootstrapSrc).toContain('/api/auth/business/refresh');
  });

  it('does not set ready before bootstrap resolves', () => {
    expect(src).toContain('useState(false)');
    expect(src).toMatch(/result\.status === 'unauthenticated'/);
    expect(src).toMatch(/setReady\(true\)/);
  });

  it('re-exports hasBusinessCabinetAccess from business-cabinet-access', () => {
    expect(src).toContain("from '@/lib/business-cabinet-access'");
  });
});
