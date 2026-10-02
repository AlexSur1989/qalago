'use client';

import type { ReactNode } from 'react';
import { postOrganicAnalyticsEvent } from '@/lib/analytics-client';

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  businessId: string;
  businessLocationId?: string | null;
  eventType: 'CALL_CLICK' | 'WHATSAPP_CLICK' | 'WEBSITE_CLICK' | 'ROUTE_CLICK' | 'INSTAGRAM_CLICK';
  external?: boolean;
};

export function TrackedContactLink({
  href,
  className,
  children,
  businessId,
  businessLocationId,
  eventType,
  external,
}: Props) {
  const onClick = () => {
    void postOrganicAnalyticsEvent({
      type: eventType,
      businessId,
      ...(businessLocationId ? { businessLocationId } : {}),
      trafficSource: 'DIRECT',
      discoverySurface: 'BUSINESS_DETAIL',
    });
  };

  if (external) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}
