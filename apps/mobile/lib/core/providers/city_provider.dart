import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../network/dio_provider.dart';
import '../../features/catalog/data/catalog_repository.dart';

class CityState {
  const CityState({required this.slug, required this.nameRu});

  final String slug;
  final String nameRu;
}

class CityNotifier extends Notifier<CityState> {
  @override
  CityState build() {
    Future.microtask(_load);
    return const CityState(slug: AppConstants.defaultCitySlug, nameRu: 'Уральск');
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final slug = prefs.getString(AppConstants.selectedCityKey) ?? AppConstants.defaultCitySlug;
    try {
      final cities = await CatalogRepository(ref.read(dioProvider)).fetchCities();
      final match = cities.firstWhere(
        (c) => c['slug'] == slug,
        orElse: () => cities.first,
      );
      state = CityState(
        slug: match['slug'] as String? ?? slug,
        nameRu: match['nameRu'] as String? ?? slug,
      );
    } catch (_) {
      state = CityState(slug: slug, nameRu: slug == 'aktobe' ? 'Актобе' : 'Уральск');
    }
  }

  Future<void> selectCity(String slug, String nameRu) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.selectedCityKey, slug);
    state = CityState(slug: slug, nameRu: nameRu);
  }
}

final cityProvider = NotifierProvider<CityNotifier, CityState>(CityNotifier.new);

final citiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return CatalogRepository(ref.read(dioProvider)).fetchCities();
});
