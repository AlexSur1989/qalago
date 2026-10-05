'use client';

import { MonetizationMode, type PlatformFeatures } from '@qalago/shared-types';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchPlatformFeatures } from '@/lib/platform-features-api';

const DEFAULT_FEATURES: PlatformFeatures = { businessTeamEnabled: false };

const DEFAULT_MONETIZATION = {
  monetizationMode: MonetizationMode.DISABLED,
  canPurchasePlans: false,
  canPurchaseAds: false,
  launchAccessActive: false,
};

type PlatformFeaturesContextValue = {
  ready: boolean;
  features: PlatformFeatures;
  configRevision: number;
  monetizationMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
  refresh: () => Promise<void>;
};

const PlatformFeaturesContext = createContext<PlatformFeaturesContextValue | null>(null);

export function PlatformFeaturesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [features, setFeatures] = useState<PlatformFeatures>(DEFAULT_FEATURES);
  const [configRevision, setConfigRevision] = useState(0);
  const [monetization, setMonetization] = useState(DEFAULT_MONETIZATION);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPlatformFeatures();
      setFeatures(data.platformFeatures);
      setConfigRevision(data.configRevision);
      setMonetization({
        monetizationMode: data.monetizationMode,
        canPurchasePlans: data.canPurchasePlans,
        canPurchaseAds: data.canPurchaseAds,
        launchAccessActive: data.launchAccessActive,
      });
    } catch {
      setFeatures(DEFAULT_FEATURES);
      setMonetization(DEFAULT_MONETIZATION);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function onFocus() {
      void refresh();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      features,
      configRevision,
      ...monetization,
      refresh,
    }),
    [ready, features, configRevision, monetization, refresh],
  );

  return (
    <PlatformFeaturesContext.Provider value={value}>{children}</PlatformFeaturesContext.Provider>
  );
}

export function usePlatformFeatures(): PlatformFeaturesContextValue {
  const ctx = useContext(PlatformFeaturesContext);
  if (!ctx) {
    throw new Error('usePlatformFeatures requires PlatformFeaturesProvider');
  }
  return ctx;
}
