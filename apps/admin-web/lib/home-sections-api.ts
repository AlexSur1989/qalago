import type {
  AdminHomeSectionsResponseDto,
  HomeSectionPlatform,
  HomeSectionType,
} from '@qalago/shared-types';
import { api } from '@/lib/api-core';

export async function getAdminHomeSections(
  token: string,
  params?: { citySlug?: string },
): Promise<AdminHomeSectionsResponseDto> {
  const qs = params?.citySlug ? `?citySlug=${encodeURIComponent(params.citySlug)}` : '';
  return api<AdminHomeSectionsResponseDto>(`/admin/home-sections${qs}`, { token });
}

export async function patchAdminHomeSection(
  token: string,
  body: {
    sectionType: HomeSectionType;
    citySlug?: string;
    enabled: boolean;
    position: number;
    platform: HomeSectionPlatform;
  },
): Promise<unknown> {
  return api('/admin/home-sections', {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
