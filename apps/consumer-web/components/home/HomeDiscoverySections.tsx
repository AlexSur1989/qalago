import { HomeSectionType } from '@qalago/shared-types';
import type { HomeDiscoveryPageData } from '@/lib/home-discovery-data';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { HomeCategoriesSection } from './HomeCategoriesSection';
import { HomePromotionsSection } from './HomePromotionsSection';

/**
 * Maps CW.3 section types to CW.4 renderers.
 * HOME_VIP_BANNER + HOME_FEATURED → CW.6 (paid placements).
 * NEARBY → deferred (requires device geo; mobile-only today).
 */
export function HomeDiscoverySections({
  locale,
  citySlug,
  labels,
  data,
}: {
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  data: HomeDiscoveryPageData;
}) {
  const { layout, categories, promotions } = data;

  if (!layout.sections.length) {
    return null;
  }

  return (
    <div className="home-discovery">
      {layout.sections.map((section) => {
        switch (section.type) {
          case HomeSectionType.CATEGORIES:
            if (categories.status === 'idle') return null;
            if (categories.status === 'error') {
              return (
                <HomeCategoriesSection
                  key={section.type}
                  locale={locale}
                  citySlug={citySlug}
                  labels={labels}
                  categories={[]}
                />
              );
            }
            return (
              <HomeCategoriesSection
                key={section.type}
                locale={locale}
                citySlug={citySlug}
                labels={labels}
                categories={categories.data}
              />
            );
          case HomeSectionType.HOME_PROMOTIONS:
            if (promotions.status === 'idle') return null;
            if (promotions.status === 'error') {
              return (
                <HomePromotionsSection
                  key={section.type}
                  locale={locale}
                  citySlug={citySlug}
                  labels={labels}
                  items={[]}
                />
              );
            }
            return (
              <HomePromotionsSection
                key={section.type}
                locale={locale}
                citySlug={citySlug}
                labels={labels}
                items={promotions.data}
              />
            );
          case HomeSectionType.HOME_VIP_BANNER:
          case HomeSectionType.HOME_FEATURED:
          case HomeSectionType.NEARBY:
            return null;
          default:
            return null;
        }
      })}
    </div>
  );
}
