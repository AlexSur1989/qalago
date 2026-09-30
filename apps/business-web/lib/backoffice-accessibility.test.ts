import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Business backoffice accessibility (UXA.11)', () => {
  const shell = readFileSync(join(__dirname, '../components/business-shell.tsx'), 'utf8');
  const globals = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');
  const messages = readFileSync(join(__dirname, '../app/messages/page.tsx'), 'utf8');
  const locale = readFileSync(join(__dirname, 'locale.ts'), 'utf8');

  it('imports a11y stylesheet and localized skip link', () => {
    expect(globals).toContain('backoffice-a11y.css');
    expect(shell).toContain('BackofficeSkipLink');
    expect(shell).toContain('shellSkipToMainContent');
    expect(locale).toContain('shellSkipToMainContent');
  });

  it('wires mobile drawer focus management', () => {
    expect(shell).toContain('useShellDrawerA11y');
    expect(shell).toContain('aria-controls="business-sidebar-nav"');
  });

  it('uses native button for unread messages without href', () => {
    expect(messages).toContain('type="button"');
    expect(messages).not.toMatch(/role=\{item\.isRead \? undefined : 'button'\}/);
    expect(messages).not.toMatch(/tabIndex=\{item\.isRead/);
  });

  it('avoids positive tabIndex in shell source', () => {
    expect(shell).not.toMatch(/tabIndex=\{[1-9]/);
  });
});
