'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { UI_LABELS, type AppLocale, type UiLabels } from '@/lib/locale';

export type { UiLabels };

type LocaleContextValue = {
  locale: AppLocale;
  ui: UiLabels;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale: initialLocale, ui: UI_LABELS[initialLocale] }),
    [initialLocale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): AppLocale {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx.locale;
}

export function useUi(): UiLabels {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useUi must be used within LocaleProvider');
  return ctx.ui;
}
