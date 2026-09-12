import { LegalLayoutClient } from '@/components/legal/legal-layout-client';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <LegalLayoutClient>{children}</LegalLayoutClient>;
}
