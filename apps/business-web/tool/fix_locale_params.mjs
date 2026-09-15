import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function patchFile(abs) {
  let c = fs.readFileSync(abs, 'utf8');
  const orig = c;
  if (!c.includes("'use client'") && !c.includes('"use client"')) return false;

  if (
    (c.includes('buildMainNavItems(') ||
      c.includes('parseApiError(') ||
      c.includes('buildPlanUsageSummary(') ||
      c.includes('buildRecentActions(') ||
      c.includes('formatTodayHeader(') ||
      c.includes('mapOnboardingError(') ||
      c.includes('mapSocialAuthError(') ||
      c.includes('menuSectionLabel(') ||
      c.includes('formatEffectivePeriod(') ||
      c.includes('formatDuration(') ||
      c.includes('funnelSteps(')) &&
    !c.includes('useLocale')
  ) {
    if (c.includes("from '@/components/locale-provider'")) {
      c = c.replace(
        "from '@/components/locale-provider'",
        "from '@/components/locale-provider'",
      );
      c = c.replace(
        /import \{ useUi \} from '@\/components\/locale-provider';/,
        "import { useLocale, useUi } from '@/components/locale-provider';",
      );
      if (!c.includes('useLocale')) {
        c = c.replace(
          /import \{ useUi \} from '@\/components\/locale-provider';/,
          "import { useLocale, useUi } from '@/components/locale-provider';",
        );
      }
    } else if (c.includes('useUi')) {
      c = c.replace(
        /import \{ useUi \} from '@\/components\/locale-provider';/,
        "import { useLocale, useUi } from '@/components/locale-provider';",
      );
    }
    if (!c.includes('const locale = useLocale()') && c.includes('const ui = useUi()')) {
      c = c.replace('const ui = useUi();', 'const locale = useLocale();\n  const ui = useUi();');
    }
  }

  c = c.replace(/buildMainNavItems\(\)/g, 'buildMainNavItems(locale)');
  c = c.replace(/buildFooterNavItems\(\)/g, 'buildFooterNavItems(locale)');
  c = c.replace(/buildPermissionPresets\(\)/g, "buildPermissionPresets(locale)");
  c = c.replace(/parseApiError\((?!locale)/g, 'parseApiError(locale, ');
  c = c.replace(/buildPlanUsageSummary\((?!locale)/g, 'buildPlanUsageSummary(locale, ');
  c = c.replace(/buildRecentActions\((?!locale)/g, 'buildRecentActions(locale, ');
  c = c.replace(/formatTodayHeader\(\)/g, 'formatTodayHeader(locale)');
  c = c.replace(/mapOnboardingError\((?!locale)/g, 'mapOnboardingError(locale, ');
  c = c.replace(/mapSocialAuthError\((?!locale)/g, 'mapSocialAuthError(locale, ');
  c = c.replace(/menuSectionLabel\((?!locale)/g, 'menuSectionLabel(locale, ');
  c = c.replace(/formatEffectivePeriod\((?!locale)/g, 'formatEffectivePeriod(locale, ');
  c = c.replace(/formatDuration\((?!locale)/g, 'formatDuration(locale, ');
  c = c.replace(/funnelSteps\((?!locale)/g, 'funnelSteps(locale, ');
  c = c.replace(/statusLabel\((?!locale)/g, 'statusLabel(locale, ');
  c = c.replace(/campaignStatusLabel\((?!locale)/g, 'campaignStatusLabel(locale, ');
  c = c.replace(/productLabel\((?!locale)/g, 'productLabel(locale, ');
  c = c.replace(/orderStatusLabel\((?!locale)/g, 'orderStatusLabel(locale, ');
  c = c.replace(/paymentStatusLabel\((?!locale)/g, 'paymentStatusLabel(locale, ');
  c = c.replace(/creativeStatusLabel\((?!locale)/g, 'creativeStatusLabel(locale, ');
  c = c.replace(/vipCampaignDisplayStatus\((?!locale)/g, 'vipCampaignDisplayStatus(locale, ');
  c = c.replace(/planTierLabel\((?!locale)/g, 'planTierLabel(locale, ');
  c = c.replace(/actionMetricLabel\((?!locale)/g, 'actionMetricLabel(locale, ');
  c = c.replace(/analyticsHeadlineForPlan\((?!locale)/g, 'analyticsHeadlineForPlan(locale, ');
  c = c.replace(/applicationStatusLabel\((?!locale)/g, 'applicationStatusLabel(locale, ');
  c = c.replace(/claimStatusLabel\((?!locale)/g, 'claimStatusLabel(locale, ');
  c = c.replace(/membershipRoleLabel\((?!locale)/g, 'membershipRoleLabel(locale, ');
  c = c.replace(/membershipStatusLabel\((?!locale)/g, 'membershipStatusLabel(locale, ');
  c = c.replace(/businessPermissionLabel\((?!locale)/g, 'businessPermissionLabel(locale, ');
  c = c.replace(/photoPublishLabel\((?!locale)/g, 'photoPublishLabel(locale, ');

  if (c.includes('buildMainNavItems(locale)') || c.includes('parseApiError(locale')) {
    c = c.replace(
      /useMemo\(\s*\(\) => filterNavByAccess\(buildMainNavItems\(locale\), access\),\s*\[access\],\s*\)/g,
      'useMemo(\n    () => filterNavByAccess(buildMainNavItems(locale), access),\n    [access, locale],\n  )',
    );
    c = c.replace(
      /useMemo\(\s*\(\) => filterNavByAccess\(buildFooterNavItems\(locale\), access\),\s*\[access\],\s*\)/g,
      'useMemo(\n    () => filterNavByAccess(buildFooterNavItems(locale), access),\n    [access, locale],\n  )',
    );
  }

  if (c !== orig) {
    fs.writeFileSync(abs, c, 'utf8');
    return true;
  }
  return false;
}

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
}

const files = [];
walk(path.join(rootDir, 'app'), files);
walk(path.join(rootDir, 'components'), files);

for (const f of files) {
  if (patchFile(f)) console.log('patched', path.relative(rootDir, f));
}
