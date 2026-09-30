import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin backoffice accessibility (UXA.11)', () => {
  const shell = readFileSync(join(__dirname, '../components/admin-shell.tsx'), 'utf8');
  const globals = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');

  it('imports a11y stylesheet and skip link', () => {
    expect(globals).toContain('backoffice-a11y.css');
    expect(shell).toContain('BackofficeSkipLink');
    expect(shell).toContain('#admin-main-content');
  });

  it('wires mobile drawer focus management', () => {
    expect(shell).toContain('useShellDrawerA11y');
    expect(shell).toContain('menuButtonRef');
    expect(shell).toContain('sidebarRef');
    expect(shell).toContain('aria-controls="admin-sidebar-nav"');
  });

  it('avoids positive tabIndex in shell source', () => {
    expect(shell).not.toMatch(/tabIndex=\{[1-9]/);
  });
});
