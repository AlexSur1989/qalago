import '../../shared/models/models.dart';
import 'map_coordinate_validity.dart';
import 'business_map_category_key.dart';
import 'map_physical_key.dart';

/// Builds MapLibre-ready GeoJSON for catalog map rows (Stage 6.11C.6B / A.7.2).
abstract final class BusinessMapGeoJsonBuilder {
  /// When [businesses] contains duplicate physical keys, the **first** wins.
  static Map<String, dynamic> buildFeatureCollection({
    required Iterable<BusinessModel> businesses,
    String? selectedLocationId,
  }) {
    final selectedKey = selectedLocationId;
    final features = <Map<String, dynamic>>[];
    final seenPhysicalKeys = <String>{};

    for (final business in businesses) {
      final physicalKey = mapPhysicalKey(business);
      if (!seenPhysicalKeys.add(physicalKey)) {
        continue;
      }
      if (!isValidMapCoordinate(business.latitude, business.longitude)) {
        continue;
      }

      final selected = physicalKey == selectedKey;
      features.add(_feature(business, physicalKey: physicalKey, selected: selected));
    }

    return {
      'type': 'FeatureCollection',
      'features': features,
    };
  }

  static Map<String, dynamic> emptyFeatureCollection() => {
        'type': 'FeatureCollection',
        'features': <Map<String, dynamic>>[],
      };

  static Map<String, dynamic> _feature(
    BusinessModel business, {
    required String physicalKey,
    required bool selected,
  }) {
    final lat = business.latitude!;
    final lng = business.longitude!;
    return {
      'type': 'Feature',
      'id': physicalKey,
      'geometry': {
        'type': 'Point',
        'coordinates': [lng, lat],
      },
      'properties': {
        'businessId': business.id,
        'locationId': physicalKey,
        if (business.categoryId != null && business.categoryId!.isNotEmpty)
          'categoryId': business.categoryId,
        'categoryKey': businessMapCategoryKey(business.categoryTitle),
        'selected': selected ? 1 : 0,
      },
    };
  }
}
