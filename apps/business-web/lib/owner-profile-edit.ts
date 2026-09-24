import type { BusinessLocationState } from '@/components/business-location/business-location-field';
import {
  BusinessPermission,
  type BusinessAccessContext,
  hasPermission,
  isOwner,
} from '@/lib/business-access';

export type OwnerProfileFormState = {
  title: string;
  shortDesc: string;
  description: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  weekdays: string;
  saturday: string;
  sunday: string;
};

export type ProfileEditPermissions = {
  canEditProfile: boolean;
  canEditHours: boolean;
  isOwner: boolean;
};

export function resolveProfileEditPermissions(
  access: BusinessAccessContext | null | undefined,
): ProfileEditPermissions {
  const canEditProfile = hasPermission(access, BusinessPermission.BUSINESS_PROFILE_EDIT);
  const canEditHours = hasPermission(access, BusinessPermission.BUSINESS_HOURS_EDIT);
  return {
    canEditProfile,
    canEditHours,
    isOwner: isOwner(access),
  };
}

export function workHoursFromOwnerForm(form: Pick<
  OwnerProfileFormState,
  'weekdays' | 'saturday' | 'sunday'
>): Record<string, string> {
  return {
    mon: form.weekdays,
    tue: form.weekdays,
    wed: form.weekdays,
    thu: form.weekdays,
    fri: form.weekdays,
    sat: form.saturday,
    sun: form.sunday,
  };
}

/** PATCH body for PATCH /businesses/:id — only keys the caller may edit. */
export function buildProfileUpdatePayload(options: {
  permissions: ProfileEditPermissions;
  form: OwnerProfileFormState;
  location: BusinessLocationState;
  includeProfile: boolean;
  includeHours: boolean;
}): Record<string, unknown> {
  const { permissions, form, location, includeProfile, includeHours } = options;
  const payload: Record<string, unknown> = {};

  if (includeProfile && permissions.canEditProfile) {
    payload.title = form.title;
    payload.shortDesc = form.shortDesc;
    payload.description = form.description;
    payload.address = location.address;
    if (location.latitude != null && location.longitude != null) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.locationSource = location.locationSource ?? 'GEOCODED';
    }
    payload.phone = form.phone;
    payload.whatsapp = form.whatsapp;
    payload.instagram = form.instagram;
    payload.website = form.website;
  }

  if (includeHours && permissions.canEditHours) {
    payload.workHours = workHoursFromOwnerForm(form);
  }

  return payload;
}
