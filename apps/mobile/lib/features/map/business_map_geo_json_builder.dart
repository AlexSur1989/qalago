import '../../shared/models/models.dart';
import 'map_coordinate_validity.dart';
import 'business_map_category_key.dart';

/// Builds MapLibre-ready GeoJSON for catalog businesses (Stage 6.11C.6B).
abstract final class BusinessMapGeoJsonBuilder {
  /// When [businesses] contains duplicate ids, the **first** occurrence wins.
  static Map<String, dynamic> buildFeatureCollection({
    required Iterable<BusinessModel> businesses,
    String? selectedBusinessId,
  }) {
    final features = <Map<String, dynamic>>[];
    final seenIds = <String>{};

    for (final business in businesses) {
      if (!seenIds.add(business.id)) {
        continue;
      }
      if (!isValidMapCoordinate(business.latitude, business.longitude)) {
        continue;
      }

      final selected = business.id == selectedBusinessId;
      features.add(_feature(business, selected: selected));
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
    required bool selected,
  }) {
    final lat = business.latitude!;
    final lng = business.longitude!;
    return {
      'type': 'Feature',
      'id': business.id,
      'geometry': {
        'type': 'Point',
        'coordinates': [lng, lat],
      },
      'properties': {
        'businessId': business.id,
        if (business.categoryId != null && business.categoryId!.isNotEmpty)
          'categoryId': business.categoryId,
        'categoryKey': businessMapCategoryKey(business.categoryTitle),
        'selected': selected ? 1 : 0,
      },
    };
  }
}
