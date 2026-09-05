'use client';

import { MonetizationShell } from '@/components/monetization/monetization-shell';

export default function MonetizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MonetizationShell>{children}</MonetizationShell>;
}
