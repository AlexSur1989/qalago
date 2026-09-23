/**
 * Stage 6.12A.7.9.1 — discovery list context (additive contract only).
 *
 * Business = discovery/card identity.
 * BusinessLocation = physical context when explicitly known.
 *
 * Map continues to use `locationId`; discovery navigation hint uses `contextLocationId`.
 * Detail continues `activeLocationId` (separate surface).
 */

export type BusinessDiscoveryContext = {
  contextLocationId?: string | null;
  distanceMeters?: number | null;
};

/**
 * When `contextLocationId` and `distanceMeters` are both present on a discovery card,
 * distance must refer to that BusinessLocation (enforced in A.7.9.2+ spatial paths).
 */
export function assertDiscoveryDistanceLocationInvariant(
  ctx: BusinessDiscoveryContext,
): void {
  if (ctx.contextLocationId == null || ctx.contextLocationId === '') {
    return;
  }
  if (ctx.distanceMeters == null) {
    return;
  }
  if (!Number.isFinite(ctx.distanceMeters) || ctx.distanceMeters < 0) {
    throw new Error(
      'discovery context: distanceMeters must be a non-negative finite number when set',
    );
  }
}

/**
 * Attach `contextLocationId` only when the caller supplies a real BusinessLocation id.
 * Never infer branch context from Business legacy coordinates.
 */
export function attachContextLocationIdForBranch<T extends object>(
  item: T,
  businessLocationId: string,
  options?: Pick<BusinessDiscoveryContext, 'distanceMeters'>,
): T & { contextLocationId: string; distanceMeters?: number } {
  const trimmed = businessLocationId.trim();
  if (!trimmed) {
    throw new Error('attachContextLocationIdForBranch requires a non-empty BusinessLocation id');
  }
  const distanceMeters =
    options?.distanceMeters != null ? options.distanceMeters : undefined;
  assertDiscoveryDistanceLocationInvariant({
    contextLocationId: trimmed,
    distanceMeters: distanceMeters ?? null,
  });
  return {
    ...item,
    contextLocationId: trimmed,
    ...(distanceMeters != null ? { distanceMeters } : {}),
  };
}

/**
 * Map list rows already expose `locationId`; mirror the same branch id as discovery context.
 * Does not remove or rename `locationId`.
 */
export function attachMapDiscoveryContext<T extends { locationId: string }>(
  item: T,
  options?: Pick<BusinessDiscoveryContext, 'distanceMeters'>,
): T & { contextLocationId: string; distanceMeters?: number } {
  return attachContextLocationIdForBranch(item, item.locationId, options);
}
