import { api } from './api-core';

export type AdminBusinessLocationRow = {
  id: string;
  businessId: string;
  cityId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
  workHours: Record<string, string> | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export const adminBusinessLocationsApi = {
  listBusinessLocations: (token: string, businessId: string) =>
    api<{ items: AdminBusinessLocationRow[] }>(
      `/businesses/${encodeURIComponent(businessId)}/locations`,
      { token },
    ),
};

/** @deprecated use adminBusinessLocationsApi */
export const adminApiLocations = adminBusinessLocationsApi;
