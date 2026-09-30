'use client';

import { BackofficeConfirmProvider } from '@qalago/brand/confirm';
import type { ReactNode } from 'react';

export function BackofficeProviders({ children }: { children: ReactNode }) {
  return <BackofficeConfirmProvider>{children}</BackofficeConfirmProvider>;
}
