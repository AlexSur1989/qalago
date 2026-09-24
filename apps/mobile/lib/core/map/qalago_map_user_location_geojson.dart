import 'qalago_map_coordinate.dart';

/// GeoJSON FeatureCollection for the native user-location source (0 or 1 Point).
abstract final class QalaGoMapUserLocationGeoJson {
  static Map<String, dynamic> featureCollection(QalaGoMapCoordinate? position) {
    if (position == null) {
      return emptyFeatureCollection();
    }
    return {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [position.longitude, position.latitude],
          },
          'properties': const <String, dynamic>{},
        },
      ],
    };
  }

  static Map<String, dynamic> emptyFeatureCollection() => const {
        'type': 'FeatureCollection',
        'features': <dynamic>[],
      };
}
