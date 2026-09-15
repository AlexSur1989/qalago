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

/// Emergency offline names when `/cities` is unreachable (must match catalog seed/DB).
const _offlineCityTaxonomy = <String, ({String nameRu, String? nameKk})>{
  'uralsk': (nameRu: 'Уральск', nameKk: 'Орал'),
  'aktobe': (nameRu: 'Актобе', nameKk: 'Ақтөбе'),
  'shymkent': (nameRu: 'Шымкент', nameKk: 'Шымкент'),
  'astana': (nameRu: 'Астана', nameKk: 'Астана'),
};

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
      final offline = _offlineCityTaxonomy[slug] ?? _offlineCityTaxonomy['uralsk']!;
      state = CityState(
        slug: slug,
        nameRu: offline.nameRu,
        nameKk: offline.nameKk,
        centerLat: slug == 'aktobe' ? 50.2839 : 51.2278,
        centerLng: slug == 'aktobe' ? 57.167 : 51.3865,
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
    final offline = _offlineCityTaxonomy[slug];
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
  return CatalogRepository(ref.read(dioProvider)).fetchCities();
});
