import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin platform features UI (BIZ.9 HOTFIX 5B)', () => {
  const platformPage = readFileSync(
    join(process.cwd(), 'app/settings/platform/page.tsx'),
    'utf8',
  );
  const settingsSubnav = readFileSync(
    join(process.cwd(), 'components/settings/settings-subnav.tsx'),
    'utf8',
  );
  const catalogPanel = readFileSync(
    join(process.cwd(), 'components/catalog/catalog-business-team-panel.tsx'),
    'utf8',
  );

  it('settings nav exposes platform features for SUPER_ADMIN only', () => {
    expect(settingsSubnav).toContain('showAdminPlatformSettingsNav');
    expect(settingsSubnav).toContain('/settings/platform');
    expect(settingsSubnav).toContain('Функции для бизнеса');
  });

  it('platform page PATCHes admin platform-features API', () => {
    expect(platformPage).toContain('patchAdminPlatformFeatures');
    expect(platformPage).toContain('businessTeamEnabled');
    expect(platformPage).not.toContain('NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM');
  });

  it('catalog env flag remains separate from runtime platform API', () => {
    expect(catalogPanel).toContain('adminBusinessTeamEnabled');
    expect(catalogPanel).not.toContain('platform-features');
  });

  it('settings nav exposes monetization mode for SUPER_ADMIN (6.18L.1)', () => {
    const monetizationPage = readFileSync(
      join(process.cwd(), 'app/settings/monetization/page.tsx'),
      'utf8',
    );
    expect(settingsSubnav).toContain('/settings/monetization');
    expect(monetizationPage).toContain('isSuperAdminRole');
    expect(monetizationPage).toContain('patchAdminPlatformFeatures');
    expect(monetizationPage).toContain('monetizationMode');
    expect(monetizationPage).toContain('MonetizationMode.LAUNCH');
    expect(monetizationPage).toContain('confirmConsequence');
    expect(monetizationPage).toContain('MonetizationMode.NORMAL');
  });
});
