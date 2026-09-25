import { Decimal } from '@prisma/client/runtime/library';
import {
  assessZeroLocationReconstructability,
  pickDeterministicPrimaryLocationId,
} from './business-location-integrity-repair.util';

describe('business-location-integrity-repair.util (unit)', () => {
  describe('pickDeterministicPrimaryLocationId', () => {
    it('chooses createdAt ASC then id ASC', () => {
      const d1 = new Date('2020-01-01');
      const d2 = new Date('2021-01-01');
      expect(
        pickDeterministicPrimaryLocationId([
          { id: 'z', createdAt: d2 },
          { id: 'a', createdAt: d1 },
          { id: 'm', createdAt: d1 },
        ]),
      ).toBe('a');
      expect(
        pickDeterministicPrimaryLocationId([
          { id: 'b', createdAt: d1 },
          { id: 'a', createdAt: d1 },
        ]),
      ).toBe('a');
    });
  });

  describe('assessZeroLocationReconstructability', () => {
    it('accepts cityId + address with null coordinates', () => {
      expect(
        assessZeroLocationReconstructability({
          cityId: 'city-1',
          address: 'Addr',
          latitude: null,
          longitude: null,
        }),
      ).toEqual({ ok: true });
    });

    it('accepts valid coordinate pair', () => {
      expect(
        assessZeroLocationReconstructability({
          cityId: 'city-1',
          address: 'Addr',
          latitude: new Decimal(51.2),
          longitude: new Decimal(51.3),
        }),
      ).toEqual({ ok: true });
    });

    it('rejects empty address', () => {
      const result = assessZeroLocationReconstructability({
        cityId: 'city-1',
        address: '   ',
        latitude: null,
        longitude: null,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorCode).toBe('MANUAL_REMEDIATION');
      }
    });

    it('rejects partial coordinates', () => {
      const result = assessZeroLocationReconstructability({
        cityId: 'city-1',
        address: 'Addr',
        latitude: new Decimal(51.2),
        longitude: null,
      });
      expect(result.ok).toBe(false);
    });
  });
});
