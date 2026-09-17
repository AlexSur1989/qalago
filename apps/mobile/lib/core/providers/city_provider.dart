import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../network/dio_provider.dart';
import '../../features/catalog/data/catalog_repository.dart';

import '../locale/localized_content.dart';
import '../../shared/utils/json_parse.dart';

class CityState {
  const CityState({
    required this.slug,
    required this.nameRu,
    this.nameKk,
    this.centerLat,
    this.centerLng,
    this.launchStatus = 'LIVE',
  });

  final String slug;
  final String nameRu;
  final String? nameKk;
  final double? centerLat;
  final double? centerLng;
  final String launchStatus;

  bool get isComingSoon => launchStatus == 'COMING_SOON';
}

/// Emergency offline catalog when `/cities` is unreachable (must match catalog seed/DB).
List<Map<String, dynamic>> offlineCityCatalogMaps() {
  return [
    {
      'slug': 'uralsk',
      'nameRu': 'Уральск',
      'nameKk': 'Орал',
      'launchStatus': 'LIVE',
      'centerLat': 51.2278,
      'centerLng': 51.3865,
    },
    {
      'slug': 'aktobe',
      'nameRu': 'Актобе',
      'nameKk': 'Ақтөбе',
      'launchStatus': 'LIVE',
      'centerLat': 50.2839,
      'centerLng': 57.167,
    },
    {
      'slug': 'shymkent',
      'nameRu': 'Шымкент',
      'nameKk': 'Шымкент',
      'launchStatus': 'LIVE',
      'centerLat': 42.3417,
      'centerLng': 69.5901,
    },
    {
      'slug': 'astana',
      'nameRu': 'Астана',
      'nameKk': 'Астана',
      'launchStatus': 'COMING_SOON',
      'centerLat': 51.1605,
      'centerLng': 71.4704,
    },
  ];
}

typedef OfflineCityNames = ({String nameRu, String? nameKk});

Map<String, dynamic> offlineCityBySlug(String slug) {
  return offlineCityCatalogMaps().firstWhere(
    (c) => c['slug'] == slug,
    orElse: () => offlineCityCatalogMaps().first,
  );
}

OfflineCityNames _offlineNamesForSlug(String slug) {
  final city = offlineCityBySlug(slug);
  return (
    nameRu: city['nameRu'] as String,
    nameKk: city['nameKk'] as String?,
  );
}

/// Resolves city list from API, falling back to [offlineCityCatalogMaps] on failure.
Future<List<Map<String, dynamic>>> resolveCityCatalogList(
  Future<List<Map<String, dynamic>>> Function() fetch,
) async {
  try {
    return await fetch();
  } catch (_) {
    final offline = offlineCityCatalogMaps();
    if (offline.isEmpty) rethrow;
    return offline;
  }
}

class CityNotifier extends Notifier<CityState> {
  @override
  CityState build() {
    Future.microtask(_load);
    return const CityState(slug: AppConstants.defaultCitySlug, nameRu: 'Уральск');
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final slug =
        prefs.getString(AppConstants.selectedCityKey) ?? AppConstants.defaultCitySlug;
    try {
      final cities = await CatalogRepository(ref.read(dioProvider)).fetchCities();
      final match = cities.firstWhere(
        (c) => c['slug'] == slug,
        orElse: () => cities.first,
      );
      state = _cityFromJson(match, fallbackSlug: slug);
    } catch (_) {
      final catalog = offlineCityBySlug(slug);
      state = CityState(
        slug: slug,
        nameRu: catalog['nameRu'] as String,
        nameKk: catalog['nameKk'] as String?,
        centerLat: parseJsonDouble(catalog['centerLat']),
        centerLng: parseJsonDouble(catalog['centerLng']),
        launchStatus: catalog['launchStatus'] as String? ?? 'LIVE',
      );
    }
  }

  Future<void> selectCity(
    String slug,
    String nameRu, {
    String? nameKk,
    double? centerLat,
    double? centerLng,
    String? launchStatus,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.selectedCityKey, slug);
    state = CityState(
      slug: slug,
      nameRu: nameRu,
      nameKk: nameKk,
      centerLat: centerLat,
      centerLng: centerLng,
      launchStatus: launchStatus ?? state.launchStatus,
    );
  }

  String displayName(String localeCode) {
    return cityDisplayName(
      localeCode: localeCode,
      nameRu: state.nameRu,
      nameKk: state.nameKk,
    );
  }

  Future<void> selectCityFromApi(Map<String, dynamic> city) async {
    final slug = city['slug'] as String? ?? '';
    final nameRu = city['nameRu'] as String? ?? slug;
    if (slug.isEmpty) return;

    await selectCity(
      slug,
      nameRu,
      nameKk: city['nameKk'] as String?,
      centerLat: parseJsonDouble(city['centerLat']),
      centerLng: parseJsonDouble(city['centerLng']),
      launchStatus: city['launchStatus'] as String?,
    );
  }

  CityState _cityFromJson(Map<String, dynamic> json, {String? fallbackSlug}) {
    final slug = json['slug'] as String? ?? fallbackSlug ?? AppConstants.defaultCitySlug;
    final offline = _offlineNamesForSlug(slug);
    return CityState(
      slug: slug,
      nameRu: json['nameRu'] as String? ?? offline?.nameRu ?? 'Уральск',
      nameKk: json['nameKk'] as String? ?? offline?.nameKk,
      centerLat: parseJsonDouble(json['centerLat']),
      centerLng: parseJsonDouble(json['centerLng']),
      launchStatus: json['launchStatus'] as String? ?? 'LIVE',
    );
  }
}

final cityProvider = NotifierProvider<CityNotifier, CityState>(CityNotifier.new);

final citiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return resolveCityCatalogList(
    () => CatalogRepository(ref.read(dioProvider)).fetchCities(),
  );
});
