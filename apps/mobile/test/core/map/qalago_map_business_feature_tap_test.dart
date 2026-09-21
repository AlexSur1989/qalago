import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_feature_tap.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';

void main() {
  group('QalaGoMapBusinessFeatureTap', () {
    test('valid QalaGo layer and feature id', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: 'biz-1',
          layerId: QalaGoMapBusinessLayerIds.unclustered,
        ),
        'biz-1',
      );
    });

    test('prefers businessId property when present', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: 'other',
          layerId: QalaGoMapBusinessLayerIds.selected,
          properties: {'businessId': 'biz-prop'},
        ),
        'biz-prop',
      );
    });

    test('parseTapTarget returns locationId and businessId', () {
      final tap = QalaGoMapBusinessFeatureTap.parseTapTarget(
        featureId: 'loc-2',
        layerId: QalaGoMapBusinessLayerIds.unclustered,
        properties: {'businessId': 'b1', 'locationId': 'loc-2'},
      );
      expect(tap?.locationId, 'loc-2');
      expect(tap?.businessId, 'b1');
    });

    test('legacy tap without locationId uses business id for both', () {
      final tap = QalaGoMapBusinessFeatureTap.parseTapTarget(
        featureId: 'b1',
        layerId: QalaGoMapBusinessLayerIds.unclustered,
        properties: {'businessId': 'b1'},
      );
      expect(tap?.locationId, 'b1');
      expect(tap?.businessId, 'b1');
    });

    test('missing businessId ignored', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: '',
          layerId: QalaGoMapBusinessLayerIds.unclustered,
        ),
        isNull,
      );
    });

    test('wrong layer ignored', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: 'biz-1',
          layerId: 'poi_r20',
        ),
        isNull,
      );
    });

    test('cluster-like feature ignored', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: '42',
          layerId: QalaGoMapBusinessLayerIds.unclustered,
          properties: {'point_count': 5, 'businessId': 'biz-1'},
        ),
        isNull,
      );
    });

    test('cluster layer never selects business', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: '42',
          layerId: QalaGoMapBusinessLayerIds.clusterCircles,
          properties: {'point_count': 5, 'cluster_id': 42},
        ),
        isNull,
      );
    });

    test('malformed properties ignored safely', () {
      expect(
        QalaGoMapBusinessFeatureTap.parseBusinessId(
          featureId: 'biz-1',
          layerId: QalaGoMapBusinessLayerIds.unclustered,
          properties: {'businessId': ''},
        ),
        'biz-1',
      );
    });
  });
}
