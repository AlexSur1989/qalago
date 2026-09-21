import { InternalServerErrorException } from '@nestjs/common';
import { BusinessPrimaryLocationService } from './business-primary-location.service';
import { deterministicPrimaryLocationId } from '../utils/business-primary-location.util';

describe('BusinessPrimaryLocationService (Stage 6.12A.3)', () => {
  const service = new BusinessPrimaryLocationService();

  const businessSnapshot = {
    id: 'biz-1',
    cityId: 'city-1',
    address: 'Main st',
    latitude: null,
    longitude: null,
    locationSource: null,
    workHours: null,
    phone: '+77001112233',
    whatsapp: null,
    instagram: null,
    website: null,
  };

  function mockTx(overrides?: {
    primaries?: Array<{ id: string; isPrimary: boolean; businessId: string }>;
    createImpl?: jest.Mock;
    updateImpl?: jest.Mock;
  }) {
    const primaries = overrides?.primaries ?? [];
    return {
      businessLocation: {
        findMany: jest.fn().mockResolvedValue(primaries),
        create: overrides?.createImpl ?? jest.fn().mockResolvedValue({ id: 'bl-1', isPrimary: true }),
        update: overrides?.updateImpl ?? jest.fn().mockResolvedValue({ id: primaries[0]?.id ?? 'bl-1' }),
      },
    };
  }

  it('resolvePrimaryLocation returns missing when no primary row', async () => {
    const tx = mockTx({ primaries: [] });
    await expect(service.resolvePrimaryLocation(tx as never, 'biz-1')).resolves.toEqual({
      status: 'missing',
    });
  });

  it('resolvePrimaryLocation returns ambiguous when multiple primaries', async () => {
    const tx = mockTx({
      primaries: [
        { id: 'a', isPrimary: true, businessId: 'biz-1' },
        { id: 'b', isPrimary: true, businessId: 'biz-1' },
      ],
    });
    await expect(service.resolvePrimaryLocation(tx as never, 'biz-1')).resolves.toEqual({
      status: 'ambiguous',
      count: 2,
    });
  });

  it('getPrimaryLocationOrThrow fails on missing primary', async () => {
    const tx = mockTx({ primaries: [] });
    await expect(service.getPrimaryLocationOrThrow(tx as never, 'biz-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('createInitialPrimary uses deterministic id aligned with A.2 backfill', async () => {
    const createImpl = jest.fn().mockResolvedValue({ id: deterministicPrimaryLocationId('biz-1') });
    const tx = mockTx({ primaries: [], createImpl });
    await service.createInitialPrimary(tx as never, businessSnapshot);
    expect(createImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: deterministicPrimaryLocationId('biz-1'),
          isPrimary: true,
        }),
      }),
    );
  });

  it('createInitialPrimary rejects when primary already exists', async () => {
    const tx = mockTx({
      primaries: [{ id: 'bl-existing', isPrimary: true, businessId: 'biz-1' }],
    });
    await expect(service.createInitialPrimary(tx as never, businessSnapshot)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('syncPrimaryFromBusinessRecord updates only resolved primary row', async () => {
    const updateImpl = jest.fn().mockResolvedValue({});
    const tx = mockTx({
      primaries: [{ id: 'bl-primary', isPrimary: true, businessId: 'biz-1' }],
      updateImpl,
    });
    await service.syncPrimaryFromBusinessRecord(tx as never, {
      ...businessSnapshot,
      phone: '+77009998877',
    });
    expect(updateImpl).toHaveBeenCalledWith({
      where: { id: 'bl-primary' },
      data: expect.objectContaining({ phone: '+77009998877' }),
    });
  });

  it('shouldSyncAfterPatch respects partial PATCH keys', () => {
    expect(service.shouldSyncAfterPatch(['title'])).toBe(false);
    expect(service.shouldSyncAfterPatch(['phone'])).toBe(true);
    expect(service.shouldSyncAfterPatch(['title', 'address'])).toBe(true);
  });
});
