import { describe, expect, it } from 'vitest';

describe('ownerApi.uploadImage business context', () => {
  it('includes businessId query on upload path', () => {
    const businessId = 'biz-abc-123';
    const path = `/uploads?businessId=${encodeURIComponent(businessId)}`;
    expect(path).toBe('/uploads?businessId=biz-abc-123');
  });

  it('attach payload includes uploadToken when provided', () => {
    const body = JSON.stringify({
      imageUrl: '/uploads/550e8400-e29b-41d4-a716-446655440000.webp',
      uploadToken: 'receipt-token',
      asCover: true,
    });
    expect(JSON.parse(body).uploadToken).toBe('receipt-token');
  });
});
