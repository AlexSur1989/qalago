/** Staff city scope for Admin catalog UI (AOP.7H.2). */

export type AdminCatalogCityRef = { id: string; slug: string };

export type AdminCatalogStaffSession = {
  role: string;
  managedCityId?: string | null;
  managedCity?: { id?: string; slug?: string } | null;
};

export type AdminCatalogStaffScope = {
  role: string;
  managedCityIds: string[];
  managedCitySlug?: string;
};

/**
 * Resolve CITY_ADMIN managed city ids from session + city list.
 * `/users/me` often exposes `managedCity.id` but not top-level `managedCityId`.
 */
export function resolveAdminCatalogManagedCityIds(
  session: AdminCatalogStaffSession,
  cities: AdminCatalogCityRef[],
): string[] {
  if (session.managedCityId) {
    return [session.managedCityId];
  }
  if (session.managedCity?.id) {
    return [session.managedCity.id];
  }
  if (session.managedCity?.slug) {
    const match = cities.find((c) => c.slug === session.managedCity!.slug);
    return match ? [match.id] : [];
  }
  return [];
}

export function buildAdminCatalogStaffScope(
  session: AdminCatalogStaffSession,
  cities: AdminCatalogCityRef[],
): AdminCatalogStaffScope {
  return {
    role: session.role,
    managedCityIds: resolveAdminCatalogManagedCityIds(session, cities),
    managedCitySlug: session.managedCity?.slug,
  };
}
