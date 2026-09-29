import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adminCatalogLabelKeys } from './admin-catalog-labels';

const appRoot = join(process.cwd(), 'app');
const libRoot = join(process.cwd(), 'lib');
const componentsRoot = join(process.cwd(), 'components');

function read(rel: string, root = appRoot): string {
  return readFileSync(join(root, rel), 'utf8');
}

/** ADMIN HOTFIX — business OWNER→MANAGER UI gated by NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM. */
describe('admin business team UI feature flag', () => {
  const detailSrc = read('catalog/businesses/[id]/page.tsx');
  const teamRouteSrc = read('catalog/businesses/[id]/team/page.tsx');
  const panelSrc = read('catalog/catalog-business-team-panel.tsx', componentsRoot);
  const flagsSrc = read('admin-feature-flags.ts', libRoot);
  const shellSrc = read('admin-shell.tsx', componentsRoot);
  const businessWebTeamSrc = readFileSync(
    join(process.cwd(), '../business-web/app/business/[id]/team/page.tsx'),
    'utf8',
  );

  it('uses centralized adminBusinessTeamEnabled helper', () => {
    expect(flagsSrc).toContain('adminBusinessTeamEnabled');
    expect(detailSrc).toContain('adminBusinessTeamEnabled');
    expect(panelSrc).toContain('adminBusinessTeamEnabled');
    expect(teamRouteSrc).toContain('adminBusinessTeamEnabled');
    expect(detailSrc).not.toMatch(/NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM/);
  });

  it('flag off wiring: panel returns null when disabled', () => {
    expect(panelSrc).toMatch(/if \(!adminBusinessTeamEnabled\(\)\) return null/);
  });

  it('flag off wiring: detail hides team link behind helper', () => {
    expect(detailSrc).toMatch(/adminBusinessTeamEnabled\(\) &&/);
    expect(detailSrc).toContain('CatalogBusinessTeamPanel');
  });

  it('direct team route fails closed when flag disabled', () => {
    expect(teamRouteSrc).toContain('AdminBusinessTeamUnavailable');
    expect(teamRouteSrc).toMatch(/if \(!adminBusinessTeamEnabled\(\)\)/);
  });

  it('unrelated catalog controls remain on detail page', () => {
    expect(detailSrc).toContain('CatalogLocationsManager');
    expect(detailSrc).toContain('canEditBusinessCore');
    expect(detailSrc).toContain('linkContent');
  });

  it('platform staff nav unchanged (not business team)', () => {
    expect(shellSrc).toContain("'users'");
    expect(shellSrc).toContain('canViewUsers');
    expect(shellSrc).not.toContain('adminBusinessTeamEnabled');
  });

  it('Business Web team page untouched by admin flag', () => {
    expect(businessWebTeamSrc).not.toContain('adminBusinessTeamEnabled');
    expect(businessWebTeamSrc).not.toContain('QALAGO_ADMIN_BUSINESS_TEAM');
    expect(businessWebTeamSrc).toContain('BusinessTeamPage');
  });

  it('RU/KK label parity for team strings', () => {
    const keys = adminCatalogLabelKeys();
    expect(keys).toContain('sectionTeam');
    expect(keys).toContain('teamFeatureUnavailableTitle');
  });
});
