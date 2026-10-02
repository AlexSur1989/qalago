import { HomeOrganicBusinessHorizontalStrip } from '@/components/home/HomeOrganicBusinessCards';
import type { HomePopularEntry } from '@/lib/home-popular-data';
import type { AppLocale, UiLabels } from '@/lib/locale';

export function HomePopularOrganicSection({
  locale,
  citySlug,
  cityId,
  labels,
  items,
}: {
  locale: AppLocale;
  citySlug: string;
  cityId?: string | null;
  labels: UiLabels;
  items: HomePopularEntry[];
}) {
  if (!items.length) return null;

  return (
    <section className="home-section" aria-labelledby="home-section-popular-heading">
      <div className="home-section__head">
        <h2 id="home-section-popular-heading" className="home-section__title">
          {labels.homeSectionPopular}
        </h2>
      </div>
      <HomeOrganicBusinessHorizontalStrip
        locale={locale}
        citySlug={citySlug}
        cityId={cityId}
        labels={labels}
        items={items}
        discoverySurface="HOME_RECOMMENDED"
      />
    </section>
  );
}
