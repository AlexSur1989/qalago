import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/city_provider.dart';
import '../../shared/utils/json_parse.dart';

/// Session-only city slug from a handled public deep link (not persisted).
class DeepLinkSessionCitySlugNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setSessionCitySlug(String citySlug) {
    final trimmed = citySlug.trim();
    state = trimmed.isEmpty ? null : trimmed;
  }

  void clearSessionCitySlug() => state = null;
}

final deepLinkSessionCitySlugProvider =
    NotifierProvider<DeepLinkSessionCitySlugNotifier, String?>(
  DeepLinkSessionCitySlugNotifier.new,
);

/// Discovery/catalog city slug: deep-link session context overrides persisted city.
final discoveryCitySlugProvider = Provider<String>((ref) {
  return ref.watch(deepLinkSessionCitySlugProvider) ??
      ref.watch(cityProvider).slug;
});

/// UI/catalog [CityState] for discovery surfaces (home, categories, search).
final discoveryCityProvider = Provider<CityState>((ref) {
  final slug = ref.watch(discoveryCitySlugProvider);
  final persisted = ref.watch(cityProvider);
  if (slug == persisted.slug) return persisted;

  final cities = ref.watch(citiesProvider);
  return cities.maybeWhen(
    data: (list) {
      for (final raw in list) {
        if (raw['slug'] == slug) {
          return CityState(
            slug: slug,
            nameRu: raw['nameRu'] as String? ?? slug,
            nameKk: raw['nameKk'] as String?,
            centerLat: parseJsonDouble(raw['centerLat']),
            centerLng: parseJsonDouble(raw['centerLng']),
            launchStatus: raw['launchStatus'] as String? ?? 'LIVE',
          );
        }
      }
      final offline = offlineCityBySlug(slug);
      return CityState(
        slug: slug,
        nameRu: offline['nameRu'] as String,
        nameKk: offline['nameKk'] as String?,
        centerLat: parseJsonDouble(offline['centerLat']),
        centerLng: parseJsonDouble(offline['centerLng']),
        launchStatus: offline['launchStatus'] as String? ?? 'LIVE',
      );
    },
    orElse: () {
      final offline = offlineCityBySlug(slug);
      return CityState(
        slug: slug,
        nameRu: offline['nameRu'] as String,
        nameKk: offline['nameKk'] as String?,
        centerLat: parseJsonDouble(offline['centerLat']),
        centerLng: parseJsonDouble(offline['centerLng']),
        launchStatus: offline['launchStatus'] as String? ?? 'LIVE',
      );
    },
  );
});
