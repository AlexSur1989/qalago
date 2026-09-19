import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_cluster_tap.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';

void main() {
  group('QalaGoMapBusinessClusterTap.parseClusterFeature', () {
    test('valid cluster feature', () {
      final target = QalaGoMapBusinessClusterTap.parseClusterFeature({
        'properties': {'cluster_id': 42, 'point_count': 5},
        'geometry': {
          'type': 'Point',
          'coordinates': [51.39, 51.22],
        },
      });
      expect(target?.clusterId, 42);
      expect(target?.center.latitude, closeTo(51.22, 0.0001));
      expect(target?.center.longitude, closeTo(51.39, 0.0001));
    });

    test('missing cluster_id ignored', () {
      expect(
        QalaGoMapBusinessClusterTap.parseClusterFeature({
          'properties': {'point_count': 3},
          'geometry': {
            'type': 'Point',
            'coordinates': [1, 2],
          },
        }),
        isNull,
      );
    });

    test('invalid cluster_id ignored', () {
      expect(
        QalaGoMapBusinessClusterTap.parseClusterFeature({
          'properties': {'cluster_id': 'bad', 'point_count': 3},
        }),
        isNull,
      );
    });

    test('individual business not cluster', () {
      expect(
        QalaGoMapBusinessClusterTap.parseClusterFeature({
          'properties': {'businessId': 'biz-1', 'selected': 0},
          'geometry': {
            'type': 'Point',
            'coordinates': [1, 2],
          },
        }),
        isNull,
      );
    });

    test('uses tap coordinates when geometry missing', () {
      final target = QalaGoMapBusinessClusterTap.parseClusterFeature(
        {
          'properties': {'cluster_id': 7, 'point_count': 2},
        },
        tapCoordinates: const LatLng(50, 57),
      );
      expect(target?.center.latitude, 50);
      expect(target?.center.longitude, 57);
    });
  });

  test('cluster layer ids recognized', () {
    expect(
      QalaGoMapBusinessClusterTap.isClusterLayerId(
        QalaGoMapBusinessLayerIds.clusterCircles,
      ),
      isTrue,
    );
    expect(
      QalaGoMapBusinessClusterTap.isClusterLayerId(
        QalaGoMapBusinessLayerIds.unclustered,
      ),
      isFalse,
    );
  });
}
