'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { postOrganicAnalyticsEvent } from '@/lib/analytics-client';

export function TrackedPromotionLink({
  href,
  className,
  children,
  businessId,
  promotionId,
  businessLocationId,
  sponsored,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  businessId: string;
  promotionId: string;
  businessLocationId?: string | null;
  sponsored?: boolean;
}) {
  const onClick = () => {
    void postOrganicAnalyticsEvent({
      type: sponsored ? 'PROMOTION_ACTION' : 'PROMOTION_VIEW',
      businessId,
      promotionId,
      ...(businessLocationId ? { businessLocationId } : {}),
      trafficSource: sponsored ? 'AD' : 'PROMOTIONS',
      discoverySurface: sponsored ? 'HOME_FEED' : 'PROMOTION_LIST',
    });
  };

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
