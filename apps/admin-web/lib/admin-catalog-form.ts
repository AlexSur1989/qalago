/** Pure builders for AOP.1 admin catalog API payloads (AOP.2). */

export type AdminCatalogInitialLocationInput = {
  cityId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  workHours?: Record<string, string>;
};

export type AdminCatalogCreateFormInput = {
  title: string;
  slug: string;
  categoryId: string;
  shortDesc?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  workHours?: Record<string, string>;
  subcategoryIds?: string[];
  initialLocation: AdminCatalogInitialLocationInput;
};

export type AdminCatalogPatchFormInput = {
  title?: string;
  shortDesc?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  workHours?: Record<string, string>;
};

const CREATE_ALLOWED_TOP_KEYS = new Set([
  'title',
  'slug',
  'categoryId',
  'shortDesc',
  'description',
  'phone',
  'whatsapp',
  'instagram',
  'website',
  'workHours',
  'subcategoryIds',
  'initialLocation',
]);

const PATCH_ALLOWED_KEYS = new Set([
  'title',
  'shortDesc',
  'description',
  'phone',
  'whatsapp',
  'instagram',
  'website',
  'workHours',
]);

export function buildAdminCreateBusinessPayload(input: AdminCatalogCreateFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    slug: input.slug.trim().toLowerCase(),
    categoryId: input.categoryId,
    initialLocation: {
      cityId: input.initialLocation.cityId,
      address: input.initialLocation.address.trim(),
      ...(input.initialLocation.latitude !== undefined
        ? { latitude: input.initialLocation.latitude }
        : {}),
      ...(input.initialLocation.longitude !== undefined
        ? { longitude: input.initialLocation.longitude }
        : {}),
      ...(input.initialLocation.phone ? { phone: input.initialLocation.phone } : {}),
      ...(input.initialLocation.whatsapp ? { whatsapp: input.initialLocation.whatsapp } : {}),
      ...(input.initialLocation.instagram ? { instagram: input.initialLocation.instagram } : {}),
      ...(input.initialLocation.website ? { website: input.initialLocation.website } : {}),
      ...(input.initialLocation.workHours ? { workHours: input.initialLocation.workHours } : {}),
    },
  };

  if (input.shortDesc?.trim()) payload.shortDesc = input.shortDesc.trim();
  if (input.description?.trim()) payload.description = input.description.trim();
  if (input.phone) payload.phone = input.phone;
  if (input.whatsapp) payload.whatsapp = input.whatsapp;
  if (input.instagram) payload.instagram = input.instagram;
  if (input.website) payload.website = input.website;
  if (input.workHours) payload.workHours = input.workHours;
  if (input.subcategoryIds?.length) payload.subcategoryIds = [...new Set(input.subcategoryIds)];

  assertNoForbiddenCreateKeys(payload);
  return payload;
}

export function buildAdminCatalogPatchPayload(input: AdminCatalogPatchFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.shortDesc !== undefined) payload.shortDesc = input.shortDesc.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp;
  if (input.instagram !== undefined) payload.instagram = input.instagram;
  if (input.website !== undefined) payload.website = input.website;
  if (input.workHours !== undefined) payload.workHours = input.workHours;

  for (const key of Object.keys(payload)) {
    if (!PATCH_ALLOWED_KEYS.has(key)) {
      throw new Error(`Forbidden catalog patch field: ${key}`);
    }
  }
  return payload;
}

function assertNoForbiddenCreateKeys(payload: Record<string, unknown>) {
  for (const key of Object.keys(payload)) {
    if (!CREATE_ALLOWED_TOP_KEYS.has(key)) {
      throw new Error(`Forbidden create field: ${key}`);
    }
  }
  const forbidden = ['ownerId', 'status', 'membership', 'memberships', 'owner', 'cityId', 'address', 'latitude', 'longitude'];
  for (const key of forbidden) {
    if (key in payload) {
      throw new Error(`Forbidden create field: ${key}`);
    }
  }
}

/** Filter subcategory ids to those belonging to category (client-side UX helper). */
export function filterSubcategoryIdsForCategory(
  subcategoryIds: string[],
  categoryId: string,
  subs: { id: string; categoryId: string }[],
): string[] {
  const allowed = new Set(subs.filter((s) => s.categoryId === categoryId).map((s) => s.id));
  return subcategoryIds.filter((id) => allowed.has(id));
}
