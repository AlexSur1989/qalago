'use client';

import { useCallback, useEffect, useState } from 'react';
import { MonetizationMode, type PlatformFeaturesResponseDto } from '@qalago/shared-types';
import { fetchPlatformFeatures } from '@/lib/platform-features-api';

export type PlatformMonetizationState = {
  loading: boolean;
  mode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
  configRevision: number;
};

const DEFAULT_STATE: PlatformMonetizationState = {
  loading: true,
  mode: MonetizationMode.DISABLED,
  canPurchasePlans: false,
  canPurchaseAds: false,
  launchAccessActive: false,
  configRevision: 0,
};

export function usePlatformMonetization(): PlatformMonetizationState {
  const [state, setState] = useState<PlatformMonetizationState>(DEFAULT_STATE);

  const load = useCallback(async () => {
    try {
      const data: PlatformFeaturesResponseDto = await fetchPlatformFeatures();
      setState({
        loading: false,
        mode: data.monetizationMode,
        canPurchasePlans: data.canPurchasePlans,
        canPurchaseAds: data.canPurchaseAds,
        launchAccessActive: data.launchAccessActive,
        configRevision: data.configRevision,
      });
    } catch {
      setState({ ...DEFAULT_STATE, loading: false });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return state;
}
