import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/providers/flutter_map_qalago_map_controller.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';

void main() {
  group('QalaGoMapCoordinate', () {
    test('equality uses lat/lng', () {
      const a = QalaGoMapCoordinate(latitude: 51.23, longitude: 51.38);
      const b = QalaGoMapCoordinate(latitude: 51.23, longitude: 51.38);
      const c = QalaGoMapCoordinate(latitude: 51.24, longitude: 51.38);
      expect(a, b);
      expect(a == c, isFalse);
    });
  });

  group('lat/lng conversion', () {
    test('round trip preserves coordinates', () {
      const original = QalaGoMapCoordinate(latitude: 51.2278, longitude: 51.3865);
      final latLng = qalaGoCoordinateToLatLng(original);
      final back = latLngToQalaGoCoordinate(latLng);
      expect(back.latitude, original.latitude);
      expect(back.longitude, original.longitude);
    });
  });
}
