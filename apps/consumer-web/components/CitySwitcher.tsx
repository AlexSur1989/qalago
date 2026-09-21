'use client';

import { useRouter } from 'next/navigation';
import type { CityDto } from '@/lib/catalog-api';
import { cityDisplayName } from '@/lib/localized-content';
import { cityHomePath } from '@/lib/routes';
import type { AppLocale, UiLabels } from '@/lib/locale';

export function CitySwitcher({
  cities,
  currentCitySlug,
  locale,
  labels,
}: {
  cities: CityDto[];
  currentCitySlug: string;
  locale: AppLocale;
  labels: UiLabels;
}) {
  const router = useRouter();
  if (cities.length <= 1) return null;

  return (
    <div className="city-switch">
      <label className="city-switch__label" htmlFor="qalago-city-select">
        {labels.citySwitcherLabel}
      </label>
      <select
        id="qalago-city-select"
        className="city-switch__select"
        value={currentCitySlug}
        onChange={(e) => {
          router.push(cityHomePath(e.target.value));
        }}
      >
        {cities.map((c) => (
          <option key={c.id} value={c.slug}>
            {cityDisplayName(c, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
