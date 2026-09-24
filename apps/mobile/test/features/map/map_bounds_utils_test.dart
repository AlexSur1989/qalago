import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_bounds_utils.dart';

QalaGoMapBounds _box(double south, double north, double west, double east) {
  return QalaGoMapBounds(
    southwest: QalaGoMapCoordinate(latitude: south, longitude: west),
    northeast: QalaGoMapCoordinate(latitude: north, longitude: east),
  );
}

void main() {
  const visible = QalaGoMapBounds(
    southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
    northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
  );

  final fetched = visible.padded(0.12);

  group('mapBoundsVisibleWithinFetchedCoverage', () {
    test('1–2 visible inside fetched padded coverage (identical viewport)', () {
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: visible),
        isTrue,
      );
      expect(
        mapViewportFetchSuppressed(fetchedCoverage: fetched, visible: visible),
        isTrue,
      );
    });

    test('3 tiny jitter inside coverage', () {
      const jittered = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.1000001, longitude: 51.2000001),
        northeast: QalaGoMapCoordinate(latitude: 51.2999999, longitude: 51.4999999),
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: jittered),
        isTrue,
      );
    });

    test('4 small pan inside coverage', () {
      const panned = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.105, longitude: 51.21),
        northeast: QalaGoMapCoordinate(latitude: 51.305, longitude: 51.51),
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: panned),
        isTrue,
      );
    });

    test('5 north edge exits coverage', () {
      final exitsNorth = _box(51.10, fetched.maxLat + 0.001, 51.20, 51.50);
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: exitsNorth),
        isFalse,
      );
    });

    test('6 south edge exits coverage', () {
      final exitsSouth = _box(fetched.minLat - 0.001, 51.30, 51.20, 51.50);
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: exitsSouth),
        isFalse,
      );
    });

    test('7 east edge exits coverage', () {
      final exitsEast = _box(51.10, 51.30, 51.20, fetched.maxLng + 0.001);
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: exitsEast),
        isFalse,
      );
    });

    test('8 west edge exits coverage', () {
      final exitsWest = _box(51.10, 51.30, fetched.minLng - 0.001, 51.50);
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: exitsWest),
        isFalse,
      );
    });

    test('9 zoom-in viewport contained', () {
      const zoomIn = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.15, longitude: 51.25),
        northeast: QalaGoMapCoordinate(latitude: 51.25, longitude: 51.45),
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: zoomIn),
        isTrue,
      );
    });

    test('10 zoom-out exceeds coverage', () {
      final zoomOut = _box(
        fetched.minLat - 0.01,
        fetched.maxLat + 0.01,
        fetched.minLng - 0.01,
        fetched.maxLng + 0.01,
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: zoomOut),
        isFalse,
      );
    });

    test('11 epsilon boundary — inside within epsilon', () {
      final atEdge = _box(
        fetched.minLat + kMapBoundsCoverageEpsilon / 2,
        fetched.maxLat - kMapBoundsCoverageEpsilon / 2,
        fetched.minLng + kMapBoundsCoverageEpsilon / 2,
        fetched.maxLng - kMapBoundsCoverageEpsilon / 2,
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: atEdge),
        isTrue,
      );
    });

    test('12 clearly outside epsilon', () {
      final outside = _box(
        fetched.minLat - kMapBoundsCoverageEpsilon * 10,
        51.30,
        51.20,
        51.50,
      );
      expect(
        mapBoundsVisibleWithinFetchedCoverage(fetched: fetched, visible: outside),
        isFalse,
      );
    });
  });

  group('mapViewportFetchSuppressed', () {
    test('null fetched coverage never suppresses', () {
      expect(
        mapViewportFetchSuppressed(fetchedCoverage: null, visible: visible),
        isFalse,
      );
    });
  });
}
