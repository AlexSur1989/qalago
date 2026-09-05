'use client';

import { MonetizationLayoutClient } from '@/components/monetization/monetization-layout-client';

export default function MonetizationLayout({ children }: { children: React.ReactNode }) {
  return <MonetizationLayoutClient>{children}</MonetizationLayoutClient>;
}
