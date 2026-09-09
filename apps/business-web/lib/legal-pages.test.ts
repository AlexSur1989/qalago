import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), 'app');

function readPage(relative: string): string {
  return readFileSync(join(root, relative), 'utf8');
}

describe('public legal pages content', () => {
  it('privacy mentions QalaGo and draft notice', () => {
    const src = readPage('privacy/page.tsx');
    expect(src).toContain('QalaGo');
    expect(src).toContain('LEGAL_PLACEHOLDERS');
  });

  it('terms includes community rules section', () => {
    const src = readPage('terms/page.tsx');
    expect(src).toContain('community');
    expect(src).toContain('не реализована');
  });

  it('account deletion describes in-app path', () => {
    const src = readPage('account-deletion/page.tsx');
    expect(src).toContain('DELETE /users/me');
    expect(src).toContain('phone=null');
  });
});
