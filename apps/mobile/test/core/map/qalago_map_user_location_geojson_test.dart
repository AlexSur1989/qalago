import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_user_location_geojson.dart';

void main() {
  test('null location yields empty FeatureCollection', () {
    final fc = QalaGoMapUserLocationGeoJson.featureCollection(null);
    expect(fc['type'], 'FeatureCollection');
    expect(fc['features'], isEmpty);
  });

  test('valid location yields one Point at lng/lat', () {
    const position = QalaGoMapCoordinate(latitude: 51.22, longitude: 51.39);
    final fc = QalaGoMapUserLocationGeoJson.featureCollection(position);
    final features = fc['features'] as List<dynamic>;
    expect(features, hasLength(1));
    final geometry = features.first['geometry'] as Map<String, dynamic>;
    expect(geometry['type'], 'Point');
    expect(geometry['coordinates'], [51.39, 51.22]);
  });

  test('coordinate update changes Point', () {
    const first = QalaGoMapCoordinate(latitude: 1, longitude: 2);
    const second = QalaGoMapCoordinate(latitude: 3, longitude: 4);
    final a = QalaGoMapUserLocationGeoJson.featureCollection(first);
    final b = QalaGoMapUserLocationGeoJson.featureCollection(second);
    expect(a['features'].first['geometry']['coordinates'], [2, 1]);
    expect(b['features'].first['geometry']['coordinates'], [4, 3]);
  });
}
