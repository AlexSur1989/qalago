'use client';

import { useLocale } from '@/components/locale-provider';
import { usePlatformFeatures } from '@/components/platform-features-provider';
import {
  launchAccessBanner,
  monetizationPurchasesDisabledNotice,
} from '@/lib/platform-monetization-ui';
import { MonetizationMode } from '@qalago/shared-types';

export function MonetizationModeBanner() {
  const locale = useLocale();
  const { ready, monetizationMode, launchAccessActive } = usePlatformFeatures();

  if (!ready) return null;

  if (launchAccessActive) {
    return (
      <div className="alert" role="status" style={{ marginBottom: 16, maxWidth: 720 }}>
        {launchAccessBanner(locale)}
      </div>
    );
  }

  if (monetizationMode === MonetizationMode.DISABLED) {
    return (
      <div className="alert" role="status" style={{ marginBottom: 16, maxWidth: 720 }}>
        {monetizationPurchasesDisabledNotice(locale)}
      </div>
    );
  }

  return null;
}
