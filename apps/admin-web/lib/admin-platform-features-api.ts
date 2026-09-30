import type { PatchPlatformFeaturesDto, PlatformFeaturesResponseDto } from '@qalago/shared-types';
import { api } from '@/lib/api-core';

export function getAdminPlatformFeatures(token: string) {
  return api<PlatformFeaturesResponseDto>('/admin/platform-features', { token });
}

export function patchAdminPlatformFeatures(token: string, body: PatchPlatformFeaturesDto) {
  return api<PlatformFeaturesResponseDto>('/admin/platform-features', {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
