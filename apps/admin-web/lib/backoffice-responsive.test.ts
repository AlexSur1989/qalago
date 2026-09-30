import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const globals = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const shell = readFileSync(join(process.cwd(), 'components/admin-shell.tsx'), 'utf8');
const responsive = readFileSync(
  join(process.cwd(), '../../packages/brand/backoffice-responsive.css'),
  'utf8',
);

describe('Admin backoffice responsive (UXA.10)', () => {
  it('imports shared responsive CSS', () => {
    expect(globals).toContain('backoffice-responsive.css');
  });

  it('uses canonical shell drawer breakpoint in shared shell CSS', () => {
    const shellCss = readFileSync(
      join(process.cwd(), '../../packages/brand/backoffice-shell.css'),
      'utf8',
    );
    expect(shellCss).toMatch(/@media \(max-width: 960px\)/);
  });

  it('does not use legacy 900px report breakpoint in app globals', () => {
    expect(globals).not.toMatch(/@media \(max-width: 900px\)/);
  });

  it('report layout stacks at 960 in shared responsive CSS', () => {
    expect(responsive).toMatch(/@media \(max-width: 960px\)[\s\S]*\.report-layout/);
  });

  it('preserves mobile nav controls in AdminShell', () => {
    expect(shell).toContain('shell-nav-backdrop');
    expect(shell).toContain('aria-expanded={mobileNavOpen}');
  });
});
