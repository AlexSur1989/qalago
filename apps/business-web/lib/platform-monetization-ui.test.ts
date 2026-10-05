import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  launchAccessBanner,
  monetizationPurchasesDisabledNotice,
} from './platform-monetization-ui';

describe('platform monetization UX (6.18L.1)', () => {
  const planPage = readFileSync(join(process.cwd(), 'app/plan/page.tsx'), 'utf8');
  const monetizationPage = readFileSync(join(process.cwd(), 'app/monetization/page.tsx'), 'utf8');
  const checkoutPage = readFileSync(
    join(process.cwd(), 'app/monetization/checkout/page.tsx'),
    'utf8',
  );
  const packageDetailPage = readFileSync(
    join(process.cwd(), 'app/monetization/packages/[code]/page.tsx'),
    'utf8',
  );
  const vipCreativePage = readFileSync(
    join(process.cwd(), 'app/monetization/vip-creative/page.tsx'),
    'utf8',
  );
  const provider = readFileSync(
    join(process.cwd(), 'components/platform-features-provider.tsx'),
    'utf8',
  );

  it('fail-closed defaults when platform-features fetch fails', () => {
    expect(provider).toContain('canPurchasePlans: false');
    expect(provider).toContain('MonetizationMode.DISABLED');
  });

  it('plan page hides purchase CTAs when canPurchasePlans is false', () => {
    expect(planPage).toContain('canPurchasePlans');
    expect(planPage).toContain('MonetizationModeBanner');
    expect(planPage).toContain('launchAccessBadge');
  });

  it('monetization hub hides ad catalog when canPurchaseAds is false', () => {
    expect(monetizationPage).toContain('canPurchaseAds');
    expect(monetizationPage).toContain('launchAccessBadge');
  });

  it('checkout skips quote when purchases disabled', () => {
    expect(checkoutPage).toContain('if (!canPurchaseAds) return');
    expect(checkoutPage).toContain('monetizationPurchasesDisabledNotice');
  });

  it('direct package detail URL is read-only when canPurchaseAds is false (6.18L.1A)', () => {
    expect(packageDetailPage).toContain('PurchasesUnavailablePanel');
    expect(packageDetailPage).toContain('!canPurchaseAds');
    expect(packageDetailPage).toContain('if (!canPurchaseAds) return');
  });

  it('direct VIP creative URL is gated (6.18L.1A)', () => {
    expect(vipCreativePage).toContain('PurchasesUnavailablePanel');
    expect(vipCreativePage).toContain('!canPurchaseAds');
  });

  it('localized copy for disabled monetization', () => {
    expect(monetizationPurchasesDisabledNotice('ru')).toContain('Монетизация');
    expect(monetizationPurchasesDisabledNotice('kk')).toContain('Монетизация');
    expect(launchAccessBanner('ru')).toContain('запуска');
  });

});
