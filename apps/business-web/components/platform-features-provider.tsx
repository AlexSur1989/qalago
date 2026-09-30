'use client';

import type { PlatformFeatures } from '@qalago/shared-types';
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

type PlatformFeaturesContextValue = {
  ready: boolean;
  features: PlatformFeatures;
  configRevision: number;
  refresh: () => Promise<void>;
};

const PlatformFeaturesContext = createContext<PlatformFeaturesContextValue | null>(null);

export function PlatformFeaturesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [features, setFeatures] = useState<PlatformFeatures>(DEFAULT_FEATURES);
  const [configRevision, setConfigRevision] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPlatformFeatures();
      setFeatures(data.platformFeatures);
      setConfigRevision(data.configRevision);
    } catch {
      setFeatures(DEFAULT_FEATURES);
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
    () => ({ ready, features, configRevision, refresh }),
    [ready, features, configRevision, refresh],
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
