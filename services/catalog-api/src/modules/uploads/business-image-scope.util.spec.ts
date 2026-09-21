import { BadRequestException } from '@nestjs/common';
import {
  assertBrandCoverOnly,
  buildBusinessImagesListWhere,
  resolveAttachLocationId,
} from './business-image-scope.util';

describe('business-image-scope.util', () => {
  it('buildBusinessImagesListWhere defaults to all', () => {
    expect(buildBusinessImagesListWhere('b1')).toEqual({ businessId: 'b1' });
  });

  it('buildBusinessImagesListWhere brand scope', () => {
    expect(buildBusinessImagesListWhere('b1', { scope: 'brand' })).toEqual({
      businessId: 'b1',
      locationId: null,
    });
  });

  it('rejects scope=brand with locationId', () => {
    expect(() =>
      buildBusinessImagesListWhere('b1', { scope: 'brand', locationId: 'loc-1' }),
    ).toThrow(BadRequestException);
  });

  it('assertBrandCoverOnly rejects branch cover', () => {
    expect(() => assertBrandCoverOnly(true, 'loc-1')).toThrow(BadRequestException);
  });

  it('resolveAttachLocationId returns null for empty', async () => {
    const result = await resolveAttachLocationId(async () => null, 'b1', undefined);
    expect(result).toBeNull();
  });

  it('resolveAttachLocationId rejects missing location', async () => {
    await expect(
      resolveAttachLocationId(async () => null, 'b1', 'missing'),
    ).rejects.toThrow(BadRequestException);
  });
});
