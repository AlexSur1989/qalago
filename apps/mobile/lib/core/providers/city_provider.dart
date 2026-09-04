import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../network/dio_provider.dart';
import '../../features/catalog/data/catalog_repository.dart';

class CityState {
  const CityState({
    required this.slug,
    required this.nameRu,
    this.centerLat,
    this.centerLng,
    this.launchStatus = 'LIVE',
  });

  final String slug;
  final String nameRu;
  final double? centerLat;
  final double? centerLng;
  final String launchStatus;

  bool get isComingSoon => launchStatus == 'COMING_SOON';
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
      state = CityState(
        slug: slug,
        nameRu: _fallbackName(slug),
        centerLat: slug == 'aktobe' ? 50.2839 : 51.2278,
        centerLng: slug == 'aktobe' ? 57.167 : 51.3865,
      );
    }
  }

  Future<void> selectCity(
    String slug,
    String nameRu, {
    double? centerLat,
    double? centerLng,
    String? launchStatus,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.selectedCityKey, slug);
    state = CityState(
      slug: slug,
      nameRu: nameRu,
      centerLat: centerLat,
      centerLng: centerLng,
      launchStatus: launchStatus ?? state.launchStatus,
    );
  }

  Future<void> selectCityFromApi(Map<String, dynamic> city) async {
    final slug = city['slug'] as String? ?? '';
    final nameRu = city['nameRu'] as String? ?? slug;
    if (slug.isEmpty) return;

    await selectCity(
      slug,
      nameRu,
      centerLat: _parseCoord(city['centerLat']),
      centerLng: _parseCoord(city['centerLng']),
      launchStatus: city['launchStatus'] as String?,
    );
  }

  CityState _cityFromJson(Map<String, dynamic> json, {String? fallbackSlug}) {
    final slug = json['slug'] as String? ?? fallbackSlug ?? AppConstants.defaultCitySlug;
    return CityState(
      slug: slug,
      nameRu: json['nameRu'] as String? ?? _fallbackName(slug),
      centerLat: _parseCoord(json['centerLat']),
      centerLng: _parseCoord(json['centerLng']),
      launchStatus: json['launchStatus'] as String? ?? 'LIVE',
    );
  }

  double? _parseCoord(Object? value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  String _fallbackName(String slug) {
    switch (slug) {
      case 'aktobe':
        return 'Актобе';
      case 'shymkent':
        return 'Шымкент';
      case 'astana':
        return 'Астана';
      default:
        return 'Уральск';
    }
  }
}

final cityProvider = NotifierProvider<CityNotifier, CityState>(CityNotifier.new);

final citiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return CatalogRepository(ref.read(dioProvider)).fetchCities();
});
