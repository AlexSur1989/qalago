import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/providers/flutter_map_qalago_map_controller.dart';
import 'package:qalago_mobile/core/map/providers/maplibre_qalago_map_controller.dart';

void main() {
  group('QalaGoMapBounds', () {
    test('min/max normalize southwest/northeast ordering', () {
      const bounds = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 10, longitude: 20),
        northeast: QalaGoMapCoordinate(latitude: 5, longitude: 25),
      );
      expect(bounds.minLat, 5);
      expect(bounds.maxLat, 10);
      expect(bounds.minLng, 20);
      expect(bounds.maxLng, 25);
    });

    test('padded expands within world limits', () {
      const bounds = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 50, longitude: 50),
        northeast: QalaGoMapCoordinate(latitude: 51, longitude: 51),
      );
      final padded = bounds.padded(0.1);
      expect(padded.minLat, lessThan(bounds.minLat));
      expect(padded.maxLat, greaterThan(bounds.maxLat));
      expect(padded.minLng, lessThan(bounds.minLng));
      expect(padded.maxLng, greaterThan(bounds.maxLng));
    });

    test('contains coordinate inside viewport', () {
      const bounds = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 50, longitude: 50),
        northeast: QalaGoMapCoordinate(latitude: 51, longitude: 51),
      );
      expect(
        bounds.contains(
          const QalaGoMapCoordinate(latitude: 50.5, longitude: 50.5),
        ),
        isTrue,
      );
      expect(
        bounds.contains(
          const QalaGoMapCoordinate(latitude: 49, longitude: 50.5),
        ),
        isFalse,
      );
    });
  });

  group('bounds adapters', () {
    test('flutter_map readVisibleBounds returns null before map is mounted', () async {
      final controller = FlutterMapQalaGoMapController();
      expect(await controller.readVisibleBounds(), isNull);
      controller.dispose();
    });

    test('maplibre controller readVisibleBounds returns null before attach', () async {
      final controller = MapLibreQalaGoMapController();
      expect(await controller.readVisibleBounds(), isNull);
      controller.dispose();
    });
  });
}
