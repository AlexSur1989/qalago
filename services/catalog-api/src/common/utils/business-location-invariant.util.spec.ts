import { ConflictException } from '@nestjs/common';
import {
  assertDeleteLocationAllowed,
  BusinessLocationLastDeleteBlockedCode,
  BusinessLocationPrimaryDeleteBlockedCode,
} from './business-location-invariant.util';

describe('business-location-invariant.util', () => {
  it('assertDeleteLocationAllowed rejects last location', () => {
    expect(() =>
      assertDeleteLocationAllowed({ locationCount: 1, primaryCount: 1 }, { isPrimary: true }),
    ).toThrow(ConflictException);
    try {
      assertDeleteLocationAllowed({ locationCount: 1, primaryCount: 1 }, { isPrimary: true });
    } catch (error) {
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: BusinessLocationLastDeleteBlockedCode,
      });
    }
  });

  it('assertDeleteLocationAllowed rejects primary when other branches exist', () => {
    try {
      assertDeleteLocationAllowed({ locationCount: 2, primaryCount: 1 }, { isPrimary: true });
    } catch (error) {
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: BusinessLocationPrimaryDeleteBlockedCode,
      });
    }
  });

  it('assertDeleteLocationAllowed allows secondary delete', () => {
    expect(() =>
      assertDeleteLocationAllowed({ locationCount: 2, primaryCount: 1 }, { isPrimary: false }),
    ).not.toThrow();
  });
});
