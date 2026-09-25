import type { BusinessLocation } from '@prisma/client';
import {
  buildEffectivePhysicalDto,
  type BusinessPhysicalFallback,
  resolveActiveBusinessLocationForDetail,
} from './business-effective-physical.util';

function loc(partial: Record<string, unknown> & { id: string }): BusinessLocation {
  return {
    businessId: 'biz-a',
    cityId: 'city-1',
    address: 'Loc address',
    latitude: 1,
    longitude: 2,
    locationSource: null,
    workHours: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    isPrimary: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    geography: null,
    ...partial,
  } as unknown as BusinessLocation;
}

const businessFallback: BusinessPhysicalFallback = {
  cityId: 'city-legacy',
  phone: '+7000',
  whatsapp: '+7111',
  instagram: '@brand',
  website: 'https://brand.kz',
  workHours: { mon: '09:00-18:00' },
};

describe('business-effective-physical.util (Stage 6.12A.7.6)', () => {
  const primary = loc({
    id: 'loc-l1',
    isPrimary: true,
    address: 'Primary addr',
    latitude: 51.1,
    longitude: 51.2,
    phone: '+7111',
  });
  const secondary = loc({
    id: 'loc-l2',
    isPrimary: false,
    address: 'Secondary addr',
    latitude: 51.24,
    longitude: 51.4,
    phone: '+7999',
    instagram: '@branch',
    workHours: { mon: '10:00-22:00' },
  });
  const locations = [primary, secondary];

  it('A — no locationId → primary effective', () => {
    const { location, resolution } = resolveActiveBusinessLocationForDetail(locations, undefined);
    expect(resolution).toBe('primary_default');
    expect(location?.id).toBe('loc-l1');
    const dto = buildEffectivePhysicalDto(businessFallback, location);
    expect(dto.locationId).toBe('loc-l1');
    expect(dto.address).toBe('Primary addr');
    expect(dto.isPrimary).toBe(true);
  });

  it('B — valid primary locationId → primary effective', () => {
    const { location } = resolveActiveBusinessLocationForDetail(locations, 'loc-l1');
    const dto = buildEffectivePhysicalDto(businessFallback, location);
    expect(dto.locationId).toBe('loc-l1');
    expect(dto.address).toBe('Primary addr');
  });

  it('C — valid secondary locationId → secondary effective', () => {
    const { location, resolution } = resolveActiveBusinessLocationForDetail(locations, 'loc-l2');
    expect(resolution).toBe('requested');
    const dto = buildEffectivePhysicalDto(businessFallback, location);
    expect(dto.locationId).toBe('loc-l2');
    expect(dto.address).toBe('Secondary addr');
    expect(dto.latitude).toBe(51.24);
  });

  it('D — L2 phone override', () => {
    const dto = buildEffectivePhysicalDto(
      businessFallback,
      resolveActiveBusinessLocationForDetail(locations, 'loc-l2').location,
    );
    expect(dto.phone).toBe('+7999');
  });

  it('E — L2 phone null → Business phone fallback', () => {
    const l2NoPhone = loc({ id: 'loc-l2b', phone: null, isPrimary: false });
    const dto = buildEffectivePhysicalDto(businessFallback, l2NoPhone);
    expect(dto.phone).toBe('+7000');
  });

  it('F — website/Instagram fallback and override', () => {
    const dtoSecondary = buildEffectivePhysicalDto(
      businessFallback,
      resolveActiveBusinessLocationForDetail(locations, 'loc-l2').location,
    );
    expect(dtoSecondary.instagram).toBe('@branch');
    expect(dtoSecondary.website).toBe('https://brand.kz');

    const l2NoSocial = loc({ id: 'x', instagram: null, website: null, isPrimary: false });
    const dtoFallback = buildEffectivePhysicalDto(businessFallback, l2NoSocial);
    expect(dtoFallback.instagram).toBe('@brand');
    expect(dtoFallback.website).toBe('https://brand.kz');
  });

  it('G — workHours override/fallback', () => {
    const dtoL2 = buildEffectivePhysicalDto(
      businessFallback,
      resolveActiveBusinessLocationForDetail(locations, 'loc-l2').location,
    );
    expect(dtoL2.workHours).toEqual({ mon: '10:00-22:00' });

    const l2NoHours = loc({ id: 'y', workHours: null, isPrimary: false });
    expect(buildEffectivePhysicalDto(businessFallback, l2NoHours).workHours).toEqual({
      mon: '09:00-18:00',
    });
  });

  it('H — wrong-business locationId → primary, no foreign branch address', () => {
    const foreignId = 'loc-other-business';
    const { location, resolution } = resolveActiveBusinessLocationForDetail(locations, foreignId);
    expect(resolution).toBe('invalid_location_fallback_primary');
    expect(location?.id).toBe('loc-l1');
    const dto = buildEffectivePhysicalDto(businessFallback, location);
    expect(dto.address).not.toBe('Secondary addr');
    expect(dto.locationId).toBe('loc-l1');
  });

  it('I — invalid locationId → primary fallback', () => {
    const { location } = resolveActiveBusinessLocationForDetail(locations, 'does-not-exist');
    expect(location?.id).toBe('loc-l1');
  });

  it('J — geo from location only, not contact defaults', () => {
    const dto = buildEffectivePhysicalDto(businessFallback, primary);
    expect(dto.address).toBe('Primary addr');
    expect(dto.latitude).toBe(51.1);
  });

  it('K — missing location fail-closed geo (A.9.4.4B)', () => {
    const dto = buildEffectivePhysicalDto(businessFallback, null);
    expect(dto.address).toBe('');
    expect(dto.latitude).toBeNull();
    expect(dto.longitude).toBeNull();
    expect(dto.cityId).toBe('city-legacy');
    expect(dto.phone).toBe('+7000');
  });
});
