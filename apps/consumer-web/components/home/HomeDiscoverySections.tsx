import { HomeSectionType } from '@qalago/shared-types';
import { HomeFeaturedAdsSection } from '@/components/ads/HomeFeaturedAdsSection';
import { HomePromotionsPaidStrip } from '@/components/ads/HomePromotionsPaidStrip';
import { HomeVipBannerAd } from '@/components/ads/HomeVipBannerAd';
import type { HomeDiscoveryPageData } from '@/lib/home-discovery-data';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { HomeCategoriesSection } from './HomeCategoriesSection';
import { HomeNearbySection } from './HomeNearbySection';
import { HomePopularOrganicSection } from './HomePopularOrganicSection';
import { HomePromotionsSection } from './HomePromotionsSection';

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
  const {
    layout,
    city,
    categories,
    promotions,
    vipBanner,
    featured,
    promotionsPaid,
    popular,
    webSessionId,
  } = data;

  const cityCenter =
    city.centerLat != null && city.centerLng != null
      ? { centerLat: city.centerLat, centerLng: city.centerLng }
      : null;

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
          case HomeSectionType.HOME_VIP_BANNER:
            if (vipBanner.status !== 'ready' || !vipBanner.data.length) return null;
            return (
              <HomeVipBannerAd
                key={section.type}
                item={vipBanner.data[0]!}
                sessionId={webSessionId}
                locale={locale}
                citySlug={citySlug}
              />
            );
          case HomeSectionType.HOME_FEATURED:
            if (featured.status !== 'ready' || !featured.data.length) return null;
            return (
              <HomeFeaturedAdsSection
                key={section.type}
                items={featured.data}
                sessionId={webSessionId}
                locale={locale}
                citySlug={citySlug}
                labels={labels}
                sectionTitle={labels.homeSectionFeatured}
              />
            );
          case HomeSectionType.HOME_PROMOTIONS:
            if (promotions.status === 'idle' && promotionsPaid.status === 'idle') return null;
            return (
              <div key={section.type}>
                {promotions.status !== 'idle' ? (
                  <HomePromotionsSection
                    locale={locale}
                    citySlug={citySlug}
                    labels={labels}
                    items={promotions.status === 'ready' ? promotions.data : []}
                    showEmpty={promotions.status !== 'error'}
                  />
                ) : null}
                {promotionsPaid.status === 'ready' && promotionsPaid.data.length ? (
                  <HomePromotionsPaidStrip
                    items={promotionsPaid.data}
                    sessionId={webSessionId}
                    locale={locale}
                    citySlug={citySlug}
                  />
                ) : null}
              </div>
            );
          case HomeSectionType.NEARBY:
            return (
              <HomeNearbySection
                key={section.type}
                locale={locale}
                citySlug={citySlug}
                cityId={city.id}
                labels={labels}
                cityCenter={cityCenter}
              />
            );
          case HomeSectionType.HOME_POPULAR:
            if (popular.status !== 'ready' || !popular.data.length) return null;
            return (
              <HomePopularOrganicSection
                key={section.type}
                locale={locale}
                citySlug={citySlug}
                cityId={city.id}
                labels={labels}
                items={popular.data}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
