import {
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
});
