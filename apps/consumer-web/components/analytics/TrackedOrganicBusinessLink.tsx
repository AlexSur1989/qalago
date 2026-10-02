'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { postOrganicAnalyticsEvent } from '@/lib/analytics-client';

type Props = {
  href: string;
  businessId: string;
  cityId?: string | null;
  businessLocationId?: string | null;
  discoverySurface: string;
  position?: number;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export function TrackedOrganicBusinessLink({
  href,
  businessId,
  cityId,
  businessLocationId,
  discoverySurface,
  position,
  className,
  children,
  onClick,
}: Props) {
  const impressionSent = useRef(false);

  useEffect(() => {
    if (impressionSent.current) return;
    impressionSent.current = true;
    void postOrganicAnalyticsEvent({
      type: 'BUSINESS_IMPRESSION',
      businessId,
      ...(cityId ? { cityId } : {}),
      ...(businessLocationId ? { businessLocationId } : {}),
      trafficSource: 'HOME',
      discoverySurface,
      ...(position != null ? { position } : {}),
    });
  }, [businessId, businessLocationId, cityId, discoverySurface, position]);

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void postOrganicAnalyticsEvent({
          type: 'VIEW_BUSINESS',
          businessId,
          ...(cityId ? { cityId } : {}),
          ...(businessLocationId ? { businessLocationId } : {}),
          trafficSource: 'HOME',
          discoverySurface,
          ...(position != null ? { position } : {}),
        });
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
