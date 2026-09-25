import type { BusinessLocation } from '@prisma/client';
import type { BusinessPhysicalFallback } from './business-effective-physical.util';
import {
  applyPublicPhysicalReadFromEffectivePhysical,
  projectPublicPhysicalReadFields,
  businessRowToPhysicalFallback,
  type PublicPhysicalReadBusinessSource,
} from './business-physical-read-normalization.util';
import {
  attachEffectivePhysicalToDetail,
  buildEffectivePhysicalDto,
  resolveActiveBusinessLocationForDetail,
} from './business-effective-physical.util';

function loc(partial: Record<string, unknown> & { id: string }): BusinessLocation {
  return {
    businessId: 'biz-1',
    cityId: 'city-1',
    address: 'Branch',
    latitude: null,
    longitude: null,
    locationSource: null,
    workHours: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    isPrimary: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ...partial,
  } as unknown as BusinessLocation;
}

const businessMirror: PublicPhysicalReadBusinessSource = {
  cityId: 'city-brand',
  phone: '+7000',
  whatsapp: '+7111',
  instagram: '@brand',
  website: 'https://brand.kz',
  workHours: { mon: '09:00-18:00' },
};

describe('business-physical-read-normalization.util (A.9.3.1)', () => {
  const primary = loc({
    id: 'loc-p',
    isPrimary: true,
    address: 'Primary addr',
    latitude: 51.1,
    longitude: 51.2,
    phone: '+7222',
  });
  const secondary = loc({
    id: 'loc-s',
    isPrimary: false,
    address: 'Secondary B',
    latitude: 51.24,
    longitude: 51.4,
    phone: '+7999',
    instagram: '@branch',
    workHours: { mon: '10:00-22:00' },
  });
  const locations = [primary, secondary];

  it('A — list without context uses primary branch physical', () => {
    const projection = projectPublicPhysicalReadFields(businessMirror, locations, undefined);
    expect(projection.address).toBe('Primary addr');
    expect(projection.latitude).toBe(51.1);
  });

  it('B — list with secondary contextLocationId uses that branch', () => {
    const projection = projectPublicPhysicalReadFields(businessMirror, locations, 'loc-s');
    expect(projection.address).toBe('Secondary B');
    expect(projection.latitude).toBe(51.24);
  });

  it('C — branch contact null falls back to Business brand defaults', () => {
    const secondaryNoPhone = loc({ id: 'loc-s2', isPrimary: false, phone: null, instagram: null });
    const projection = projectPublicPhysicalReadFields(businessMirror, [primary, secondaryNoPhone], 'loc-s2');
    expect(projection.phone).toBe('+7000');
    expect(projection.instagram).toBe('@brand');
  });

  it('F — foreign contextLocationId falls back to own primary', () => {
    const projection = projectPublicPhysicalReadFields(businessMirror, locations, 'foreign-loc');
    expect(projection.address).toBe('Primary addr');
    expect(projection.address).not.toBe('Secondary B');
  });

  it('H — zero locations fail-closed (no legacy Business geo)', () => {
    const projection = projectPublicPhysicalReadFields(businessMirror, [], undefined);
    expect(projection.address).toBe('');
    expect(projection.latitude).toBeNull();
    expect(projection.longitude).toBeNull();
    expect(projection.cityId).toBe('city-brand');
  });

  it('A.9.4.4B — stale Business geo on row ignored when primary BL differs', () => {
    const staleRow = {
      ...businessMirror,
      address: 'STALE Business mirror',
      latitude: 99,
      longitude: 88,
    };
    const projection = projectPublicPhysicalReadFields(staleRow, locations, undefined);
    expect(projection.address).toBe('Primary addr');
    expect(projection.latitude).toBe(51.1);
    expect(projection.longitude).toBe(51.2);
  });

  it('J — zero-primary uses oldest location (same as effective physical)', () => {
    const older = loc({
      id: 'loc-old',
      isPrimary: false,
      createdAt: new Date('2023-01-01'),
      address: 'Oldest',
    });
    const newer = loc({
      id: 'loc-new',
      isPrimary: false,
      createdAt: new Date('2025-01-01'),
      address: 'Newer',
    });
    const { location } = resolveActiveBusinessLocationForDetail([newer, older], undefined);
    expect(location?.id).toBe('loc-old');
    const projection = projectPublicPhysicalReadFields(businessMirror, [newer, older], undefined);
    expect(projection.address).toBe('Oldest');
  });

  it('D/E — detail top-level matches effectivePhysical', () => {
    const withEffective = attachEffectivePhysicalToDetail(
      { id: 'biz-1', ...businessRowToPhysicalFallback(businessMirror) } as BusinessPhysicalFallback & {
        id: string;
      },
      locations,
      'loc-s',
    );
    const normalized = applyPublicPhysicalReadFromEffectivePhysical(withEffective);
    expect(normalized.address).toBe(normalized.effectivePhysical.address);
    expect(normalized.address).toBe('Secondary B');
    expect(normalized.phone).toBe('+7999');
  });

  it('detail without locationId aligns top-level with primary effectivePhysical', () => {
    const withEffective = attachEffectivePhysicalToDetail(
      { id: 'biz-1', ...businessRowToPhysicalFallback(businessMirror) } as BusinessPhysicalFallback & {
        id: string;
      },
      locations,
    );
    const normalized = applyPublicPhysicalReadFromEffectivePhysical(withEffective);
    expect(normalized.address).toBe('Primary addr');
  });
});
