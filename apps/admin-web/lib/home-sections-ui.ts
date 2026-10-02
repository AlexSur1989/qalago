import { HomeSectionPlatform, HomeSectionType } from '@qalago/shared-types';

export const HOME_SECTION_LABELS: Record<HomeSectionType, string> = {
  [HomeSectionType.HOME_VIP_BANNER]: 'VIP-баннер',
  [HomeSectionType.CATEGORIES]: 'Категории',
  [HomeSectionType.HOME_FEATURED]: 'Рекомендуемые',
  [HomeSectionType.HOME_PROMOTIONS]: 'Акции',
  [HomeSectionType.NEARBY]: 'Рядом',
};

export const HOME_PLATFORM_LABELS: Record<HomeSectionPlatform, string> = {
  [HomeSectionPlatform.ALL]: 'Все платформы',
  [HomeSectionPlatform.APP]: 'Только приложение',
  [HomeSectionPlatform.WEB]: 'Только сайт',
};
