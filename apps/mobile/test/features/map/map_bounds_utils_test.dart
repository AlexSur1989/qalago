import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_bounds_utils.dart';

void main() {
  group('mapBoundsFetchNeeded', () {
    const first = QalaGoMapBounds(
      southwest: QalaGoMapCoordinate(latitude: 50, longitude: 50),
      northeast: QalaGoMapCoordinate(latitude: 51, longitude: 51),
    );

    test('true when previous is null', () {
      expect(mapBoundsFetchNeeded(previous: null, next: first), isTrue);
    });

    test('false for tiny movement', () {
      const next = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 50.0001, longitude: 50.0001),
        northeast: QalaGoMapCoordinate(latitude: 51.0001, longitude: 51.0001),
      );
      expect(mapBoundsFetchNeeded(previous: first, next: next), isFalse);
    });

    test('true for meaningful pan', () {
      const next = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 49, longitude: 49),
        northeast: QalaGoMapCoordinate(latitude: 50, longitude: 50),
      );
      expect(mapBoundsFetchNeeded(previous: first, next: next), isTrue);
    });
  });
}
