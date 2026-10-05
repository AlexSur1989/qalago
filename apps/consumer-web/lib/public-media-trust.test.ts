import { describe, expect, it } from 'vitest';
import { isLegacyExternalMediaUrl, isRelativeUploadsPath } from './public-media-trust';

describe('public media trust', () => {
  it('recognizes relative uploads paths', () => {
    expect(isRelativeUploadsPath('/uploads/550e8400-e29b-41d4-a716-446655440000.webp')).toBe(true);
  });

  it('treats unknown external hosts as legacy', () => {
    expect(isLegacyExternalMediaUrl('https://cdn.legacy.example/photo.jpg')).toBe(true);
  });
});
