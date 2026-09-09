import { BusinessRequestsLayoutClient } from '@/components/business-requests/business-requests-layout-client';

export default function BusinessRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessRequestsLayoutClient>{children}</BusinessRequestsLayoutClient>;
}
