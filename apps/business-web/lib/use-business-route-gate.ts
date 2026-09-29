'use client';

import { findMyBusinessItem } from '@/lib/api';
import {
  BUSINESS_ROUTE_ACCESS,
  type BusinessRouteAccessRequirement,
  isBusinessRouteContentAllowed,
} from '@/lib/business-route-access';
import { useBusinessAccess } from '@/lib/use-business-access';

/** Selected-business or explicit route business id access for fail-closed page gates. */
export function useBusinessRouteGate(
  requirement: BusinessRouteAccessRequirement,
  routeBusinessId?: string,
) {
  const ctx = useBusinessAccess();
  const routeItem = routeBusinessId
    ? findMyBusinessItem(ctx.items, routeBusinessId)
    : null;
  const business = routeBusinessId ? routeItem?.business ?? null : ctx.business;
  const access = routeBusinessId ? routeItem?.access ?? null : ctx.access;
  const allowed = isBusinessRouteContentAllowed(
    ctx.ready,
    access,
    requirement,
    business != null,
  );

  return {
    ...ctx,
    business,
    access,
    allowed,
    requirement,
  };
}

export { BUSINESS_ROUTE_ACCESS };
