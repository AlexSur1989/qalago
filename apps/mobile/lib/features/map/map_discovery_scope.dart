import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Category-originated map context (from «На карте» on category screen).
/// [subcategoryId] null means «Все» within [categoryId].
class MapDiscoveryScope {
  const MapDiscoveryScope({
    required this.categoryId,
    this.subcategoryId,
  });

  final String categoryId;
  final String? subcategoryId;
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

/// Global Map (no scope) → city-wide. Category Map → categoryId; optional subcategory when flag ON.
MapBusinessesFetchParams resolveMapBusinessesFetchParams({
  required bool subcategoriesEnabled,
  required MapDiscoveryScope? scope,
  required String citySlug,
}) {
  if (scope == null) {
    return MapBusinessesFetchParams(citySlug: citySlug);
  }

  final subcategoryId = subcategoriesEnabled &&
          scope.subcategoryId != null &&
          scope.subcategoryId!.isNotEmpty
      ? scope.subcategoryId
      : null;

  return MapBusinessesFetchParams(
    citySlug: citySlug,
    categoryId: scope.categoryId,
    subcategoryId: subcategoryId,
  );
}
