'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { BackofficeConfirmDialog } from './BackofficeConfirmDialog';
import { registerBackofficeConfirm } from './bridge';
import type { BackofficeConfirmOptions } from './types';

type Pending = BackofficeConfirmOptions & { resolve: (value: boolean) => void };

const ConfirmContext = createContext<((options: BackofficeConfirmOptions | string) => Promise<boolean>) | null>(
  null,
);

export function BackofficeConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback((options: BackofficeConfirmOptions | string) => {
    const opts: BackofficeConfirmOptions =
      typeof options === 'string'
        ? { title: 'Подтверждение', description: options, variant: 'default' }
        : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  useEffect(() => {
    registerBackofficeConfirm(confirm);
    return () => registerBackofficeConfirm(null);
  }, [confirm]);

  function close(result: boolean) {
    if (!pending) return;
    pending.resolve(result);
    setPending(null);
    setBusy(false);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <BackofficeConfirmDialog
        open={pending != null}
        pending={busy}
        title={pending?.title ?? ''}
        description={pending?.description}
        consequence={pending?.consequence}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        variant={pending?.variant}
        onCancel={() => close(false)}
        onConfirm={() => {
          setBusy(true);
          close(true);
        }}
      />
    </ConfirmContext.Provider>
  );
}

export function useBackofficeConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useBackofficeConfirm requires BackofficeConfirmProvider');
  }
  return ctx;
}
