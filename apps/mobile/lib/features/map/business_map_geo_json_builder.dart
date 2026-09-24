import '../../shared/models/models.dart';
import '../../core/map/qalago_map_business_geojson_fingerprint.dart';
import 'map_coordinate_validity.dart';
import 'business_map_category_key.dart';
import 'map_physical_key.dart';
import 'native_business_map_geo_json_payload.dart';

/// Builds MapLibre-ready GeoJSON for catalog map rows (Stage 6.11C.6B / A.7.2).
abstract final class BusinessMapGeoJsonBuilder {
  /// When [businesses] contains duplicate physical keys, the **first** wins.
  static Map<String, dynamic> buildFeatureCollection({
    required Iterable<BusinessModel> businesses,
    String? selectedLocationId,
  }) {
    return buildPayload(
      businesses: businesses,
      selectedLocationId: selectedLocationId,
    ).featureCollection;
  }

  /// GeoJSON + deterministic semantic fingerprint for native sync dedup (C3.2).
  static NativeBusinessMapGeoJsonPayload buildPayload({
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

    return NativeBusinessMapGeoJsonPayload(
      featureCollection: {
        'type': 'FeatureCollection',
        'features': features,
      },
      contentFingerprint: QalaGoMapBusinessGeoJsonFingerprint.fromFeatureMaps(features),
    );
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
