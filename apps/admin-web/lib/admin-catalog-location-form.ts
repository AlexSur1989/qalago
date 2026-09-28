/** Admin BusinessLocation mutation payloads (AOP.3). */

export type AdminLocationFormInput = {
  cityId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  workHours?: Record<string, string>;
};

const ALLOWED = new Set([
  'cityId',
  'address',
  'latitude',
  'longitude',
  'locationSource',
  'phone',
  'whatsapp',
  'instagram',
  'website',
  'workHours',
]);

export function buildAdminLocationPayload(input: AdminLocationFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    cityId: input.cityId,
    address: input.address.trim(),
  };
  if (input.latitude !== undefined) payload.latitude = input.latitude;
  if (input.longitude !== undefined) payload.longitude = input.longitude;
  if (input.locationSource) payload.locationSource = input.locationSource;
  if (input.phone) payload.phone = input.phone;
  if (input.whatsapp) payload.whatsapp = input.whatsapp;
  if (input.instagram) payload.instagram = input.instagram;
  if (input.website) payload.website = input.website;
  if (input.workHours) payload.workHours = input.workHours;

  for (const key of Object.keys(payload)) {
    if (!ALLOWED.has(key)) throw new Error(`Forbidden location field: ${key}`);
  }
  if ('businessId' in payload || 'isPrimary' in payload || 'ownerId' in payload) {
    throw new Error('Forbidden location field');
  }
  return payload;
}
