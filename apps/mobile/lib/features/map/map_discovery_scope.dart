import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Ephemeral category/subcategory context when opening Map from category discovery.
/// Not used when user opens Map from bottom navigation (scope cleared).
class MapDiscoveryScope {
  const MapDiscoveryScope({
    required this.categoryId,
    required this.subcategoryId,
  });

  final String categoryId;
  final String subcategoryId;
}

final mapDiscoveryScopeProvider = StateProvider<MapDiscoveryScope?>((ref) => null);

class MapBusinessesFetchParams {
  const MapBusinessesFetchParams({
    required this.citySlug,
    this.categoryId,
    this.subcategoryId,
  });

  final String citySlug;
  final String? categoryId;
  final String? subcategoryId;
}

/// When flag OFF or no subcategory selected, map uses city-wide fetch (pre-6.8C.1).
MapBusinessesFetchParams resolveMapBusinessesFetchParams({
  required bool subcategoriesEnabled,
  required MapDiscoveryScope? scope,
  required String citySlug,
}) {
  if (!subcategoriesEnabled ||
      scope == null ||
      scope.subcategoryId.isEmpty) {
    return MapBusinessesFetchParams(citySlug: citySlug);
  }
  return MapBusinessesFetchParams(
    citySlug: citySlug,
    categoryId: scope.categoryId,
    subcategoryId: scope.subcategoryId,
  );
}
