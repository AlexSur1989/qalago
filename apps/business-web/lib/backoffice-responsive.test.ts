import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const globals = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const shell = readFileSync(join(process.cwd(), 'components/business-shell.tsx'), 'utf8');

describe('Business backoffice responsive (UXA.10)', () => {
  it('imports shared responsive CSS', () => {
    expect(globals).toContain('backoffice-responsive.css');
  });

  it('shows truncated business title on narrow topbar', () => {
    expect(shell).toContain('topbar-entity-title');
  });

  it('wraps locale switcher for topbar reflow', () => {
    expect(shell).toContain('topbar-locale');
  });

  it('uses horizontal scroll class on monetization subnav', () => {
    const subnav = readFileSync(
      join(process.cwd(), 'components/monetization/monetization-subnav.tsx'),
      'utf8',
    );
    expect(subnav).toContain('monetization-subnav--scroll');
  });
});
