/** Logical home feed sections (CW.3) — shared backend + clients. */
export enum HomeSectionType {
  HOME_VIP_BANNER = 'HOME_VIP_BANNER',
  CATEGORIES = 'CATEGORIES',
  HOME_FEATURED = 'HOME_FEATURED',
  HOME_PROMOTIONS = 'HOME_PROMOTIONS',
  NEARBY = 'NEARBY',
  HOME_POPULAR = 'HOME_POPULAR',
}

export enum HomeSectionPlatform {
  APP = 'APP',
  WEB = 'WEB',
  ALL = 'ALL',
}

export const HOME_SECTION_TYPES = Object.values(HomeSectionType);

export type PublicHomeSectionDto = {
  type: HomeSectionType;
  enabled: boolean;
  position: number;
};

export type AdminHomeSectionRowDto = {
  id: string | null;
  sectionType: HomeSectionType;
  platform: HomeSectionPlatform;
  enabled: boolean;
  position: number;
  scope: 'global' | 'city';
  /** True when effective value comes from global row (no city override row). */
  inherited: boolean;
};

export type AdminHomeSectionsResponseDto = {
  citySlug: string | null;
  cityId: string | null;
  sections: AdminHomeSectionRowDto[];
};
