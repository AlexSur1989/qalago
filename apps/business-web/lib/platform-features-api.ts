import type { PlatformFeaturesResponseDto } from '@qalago/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export async function fetchPlatformFeatures(): Promise<PlatformFeaturesResponseDto> {
  const res = await fetch(`${API_BASE}/platform-features`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`platform-features ${res.status}`);
  }
  return res.json() as Promise<PlatformFeaturesResponseDto>;
}
