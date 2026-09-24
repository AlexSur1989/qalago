import { describe, expect, it } from 'vitest';
import {
  buildProfileUpdatePayload,
  resolveProfileEditPermissions,
  workHoursFromOwnerForm,
} from './owner-profile-edit';
import { BusinessPermission } from './business-access';
import { ownerProfilePrimaryBranchCopy } from './presentation';

const baseForm = {
  title: 'T',
  shortDesc: 'S',
  description: 'D',
  phone: '+1',
  whatsapp: '+2',
  instagram: '@i',
  website: 'https://x',
  weekdays: '09:00-18:00',
  saturday: '10:00-16:00',
  sunday: 'closed',
};

const location = {
  address: 'Addr',
  latitude: 51.2,
  longitude: 51.3,
  locationSource: 'GEOCODED' as const,
};

describe('resolveProfileEditPermissions', () => {
  it('OWNER has both profile and hours', () => {
    const p = resolveProfileEditPermissions({ role: 'OWNER', permissions: [] });
    expect(p.canEditProfile).toBe(true);
    expect(p.canEditHours).toBe(true);
    expect(p.isOwner).toBe(true);
  });

  it('hours-only manager', () => {
    const p = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [BusinessPermission.BUSINESS_HOURS_EDIT],
    });
    expect(p.canEditProfile).toBe(false);
    expect(p.canEditHours).toBe(true);
  });

  it('profile-only manager', () => {
    const p = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [BusinessPermission.BUSINESS_PROFILE_EDIT],
    });
    expect(p.canEditProfile).toBe(true);
    expect(p.canEditHours).toBe(false);
  });

  it('neither permission', () => {
    const p = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [BusinessPermission.CATALOG_EDIT],
    });
    expect(p.canEditProfile).toBe(false);
    expect(p.canEditHours).toBe(false);
  });
});

describe('buildProfileUpdatePayload', () => {
  it('A — hours-only: workHours only, no profile/physical fields', () => {
    const permissions = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [BusinessPermission.BUSINESS_HOURS_EDIT],
    });
    const payload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: false,
      includeHours: true,
    });
    expect(payload).toEqual({
      workHours: workHoursFromOwnerForm(baseForm),
    });
    expect(payload).not.toHaveProperty('address');
    expect(payload).not.toHaveProperty('title');
    expect(payload).not.toHaveProperty('phone');
    expect(payload).not.toHaveProperty('locationId');
  });

  it('B — profile-only: profile fields, no workHours', () => {
    const permissions = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [BusinessPermission.BUSINESS_PROFILE_EDIT],
    });
    const payload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: true,
      includeHours: false,
    });
    expect(payload.workHours).toBeUndefined();
    expect(payload.title).toBe('T');
    expect(payload.address).toBe('Addr');
    expect(payload.latitude).toBe(51.2);
    expect(payload).not.toHaveProperty('locationId');
  });

  it('C — both permissions: full profile slice when requested', () => {
    const permissions = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [
        BusinessPermission.BUSINESS_PROFILE_EDIT,
        BusinessPermission.BUSINESS_HOURS_EDIT,
      ],
    });
    const profilePayload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: true,
      includeHours: false,
    });
    const hoursPayload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: false,
      includeHours: true,
    });
    expect(profilePayload.workHours).toBeUndefined();
    expect(hoursPayload.workHours).toBeDefined();
    expect(profilePayload.address).toBe('Addr');
  });

  it('E — OWNER full profile + hours payloads', () => {
    const permissions = resolveProfileEditPermissions({ role: 'OWNER', permissions: [] });
    const payload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: true,
      includeHours: true,
    });
    expect(payload.title).toBe('T');
    expect(payload.workHours).toEqual(workHoursFromOwnerForm(baseForm));
  });

  it('D — neither: empty payload even if include flags true', () => {
    const permissions = resolveProfileEditPermissions({
      role: 'MANAGER',
      permissions: [],
    });
    const payload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: true,
      includeHours: true,
    });
    expect(Object.keys(payload)).toHaveLength(0);
  });

  it('F — primary branch section copy (RU/KK)', () => {
    expect(ownerProfilePrimaryBranchCopy('ru').sectionTitle).toBe('Основной филиал');
    expect(ownerProfilePrimaryBranchCopy('kk').sectionTitle).toBe('Негізгі филиал');
  });

  it('G — branch management link label present', () => {
    expect(ownerProfilePrimaryBranchCopy('ru').manageBranchesLink).toContain('филиал');
  });

  it('H — never includes locationId (secondary safety)', () => {
    const permissions = resolveProfileEditPermissions({ role: 'OWNER', permissions: [] });
    const payload = buildProfileUpdatePayload({
      permissions,
      form: baseForm,
      location,
      includeProfile: true,
      includeHours: true,
    });
    expect(payload).not.toHaveProperty('locationId');
  });
});
