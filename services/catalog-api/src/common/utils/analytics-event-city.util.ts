/**
 * Stage 6.12A.9.4.1B — organic analytics event city attribution priority (A.9.4.0).
 * Does not rewrite historical rows; used when creating new AnalyticsEvent records.
 */
export type AnalyticsEventCityInput = {
  /** Explicit request/discovery city (e.g. SEARCH_PERFORMED). */
  explicitCityId?: string | null;
  /** Resolved BusinessLocation.cityId when businessLocationId is set. */
  businessLocationCityId?: string | null;
  /** Ad campaign context city. */
  campaignCityId?: string | null;
  /** Primary BusinessLocation.cityId for business-scoped events. */
  primaryBusinessLocationCityId?: string | null;
  /** Legacy parent Business.cityId compatibility fallback. */
  parentBusinessCityId?: string | null;
};

export function resolveAnalyticsEventCityId(
  input: AnalyticsEventCityInput,
): string | undefined {
  const explicit = trimId(input.explicitCityId);
  if (explicit) return explicit;

  const branchCity = trimId(input.businessLocationCityId);
  if (branchCity) return branchCity;

  const campaignCity = trimId(input.campaignCityId);
  if (campaignCity) return campaignCity;

  const primaryCity = trimId(input.primaryBusinessLocationCityId);
  if (primaryCity) return primaryCity;

  return trimId(input.parentBusinessCityId);
}

function trimId(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
