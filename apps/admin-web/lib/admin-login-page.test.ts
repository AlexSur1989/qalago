import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Admin login page (AOP.7H dev login hardening)', () => {
  const src = readFileSync(join(__dirname, '../app/login/page.tsx'), 'utf8');

  it('starts with empty phone state', () => {
    expect(src).toMatch(/useState\s*\(\s*['"]['"]\s*\)/);
  });

  it('does not render static SUPER or stale seed phones', () => {
    expect(src).not.toContain('+77473850274');
    expect(src).not.toContain('+77000000001');
    expect(src).not.toMatch(/SUPER_ADMIN/i);
  });

  it('gates dev helpers on adminWebDevLoginEnabled', () => {
    expect(src).toContain('adminWebDevLoginEnabled');
    expect(src).toMatch(/adminWebDevLoginEnabled\s*&&[\s\S]*devSeedAccounts/);
    expect(src).toMatch(/adminWebDevLoginEnabled\s*&&[\s\S]*Войти без SMS/);
  });

  it('uses devSeedAccounts for quick-login labels only', () => {
    expect(src).toContain('devSeedAccounts.map');
    expect(src).toContain('devSuperAdminManualHintRu');
  });
});
