'use client';

import { useEffect, useState } from 'react';
import { HomeOrganicBusinessVerticalList } from '@/components/home/HomeOrganicBusinessCards';
import { readBrowserGeolocationOnce } from '@/lib/browser-geolocation';
import { fetchBusinesses } from '@/lib/catalog-api';
import type { CityCenter } from '@/lib/nearby-geo';
import {
  NEARBY_MAX_PREVIEW_ITEMS,
  NEARBY_RADIUS_KM,
  nearbyUsesUserGps,
  resolveNearbySearchPosition,
  sortNearbyBusinesses,
} from '@/lib/nearby-geo';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { toPublicBusinessCard, type PublicBusinessCard } from '@/lib/public-business';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'error' }
  | { phase: 'ready'; items: PublicBusinessCard[]; usesGps: boolean };

export function HomeNearbySection({
  locale,
  citySlug,
  cityId,
  labels,
  cityCenter,
}: {
  locale: AppLocale;
  citySlug: string;
  cityId?: string | null;
  labels: UiLabels;
  cityCenter: CityCenter | null;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const geo = await readBrowserGeolocationOnce();
      const userPos = geo.status === 'ready' ? geo.position : null;
      const searchPos = resolveNearbySearchPosition(userPos, cityCenter);
      if (!searchPos) {
        if (!cancelled) setState({ phase: 'empty' });
        return;
      }

      const usesGps = nearbyUsesUserGps(userPos, cityCenter);

      try {
        const res = await fetchBusinesses({
          citySlug,
          latitude: searchPos.latitude,
          longitude: searchPos.longitude,
          radiusKm: NEARBY_RADIUS_KM,
          limit: NEARBY_MAX_PREVIEW_ITEMS,
          page: 1,
        });
        const sorted = sortNearbyBusinesses(res.items ?? []).slice(0, NEARBY_MAX_PREVIEW_ITEMS);
        const cards = sorted.map((raw) => toPublicBusinessCard(raw));
        if (cancelled) return;
        if (!cards.length) {
          setState({ phase: 'empty' });
          return;
        }
        setState({ phase: 'ready', items: cards, usesGps });
      } catch {
        if (!cancelled) setState({ phase: 'error' });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cityCenter, citySlug]);

  if (state.phase === 'loading') {
    return (
      <section className="home-section" aria-labelledby="home-section-nearby-heading">
        <div className="home-section__head">
          <h2 id="home-section-nearby-heading" className="home-section__title">
            {labels.homeNearbySection}
          </h2>
          <p className="home-section__lead">{labels.homeNearbyLoading}</p>
        </div>
      </section>
    );
  }

  if (state.phase === 'empty' || state.phase === 'error') {
    return null;
  }

  const title = state.usesGps ? labels.homeNearbySection : labels.homeNearbyCitySection;
  const subtitle = state.usesGps ? labels.homeNearbySubtitle : labels.homeNearbyCitySubtitle;

  return (
    <section className="home-section" aria-labelledby="home-section-nearby-heading">
      <div className="home-section__head">
        <h2 id="home-section-nearby-heading" className="home-section__title">
          {title}
        </h2>
        <p className="home-section__lead">{subtitle}</p>
      </div>
      <HomeOrganicBusinessVerticalList
        locale={locale}
        citySlug={citySlug}
        cityId={cityId}
        labels={labels}
        items={state.items}
        discoverySurface="NEARBY_LIST"
      />
    </section>
  );
}
