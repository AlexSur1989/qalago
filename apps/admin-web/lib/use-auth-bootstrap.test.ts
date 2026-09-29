import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('useAuth bootstrap wiring (AOP.7H.3)', () => {
  const src = readFileSync(join(__dirname, 'use-auth.ts'), 'utf8');

  it('refresh path uses loadCanonicalAdminUser instead of slim refresh user', () => {
    expect(src).toContain('loadCanonicalAdminUser');
    expect(src).not.toMatch(/setUser\s*\(\s*data\.user\s*\)/);
  });

  it('does not set ready before canonical user load completes', () => {
    expect(src).toMatch(/loadCanonicalAdminUser[\s\S]*setUser\(loaded\.user\)[\s\S]*setReady\(true\)/);
  });
});
