import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_geojson_source.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_business_layer_controller.dart';
import 'qalago_map_business_layer_test_sink.dart';

void main() {
  group('QalaGoMapBusinessGeoJsonSource', () {
    test('cluster JSON uses supported options only', () {
      final json = QalaGoMapBusinessGeoJsonSource.propertiesJsonFor(
        QalaGoMapBusinessLayerController.emptyFeatureCollection(),
      );
      expect(json['cluster'], isTrue);
      expect(json['clusterRadius'], 55.0);
      expect(json['clusterMaxZoom'], 14.0);
      expect(json.containsKey('clusterMinPoints'), isFalse);
    });

    test('defers clustered source when feature count is zero', () {
      expect(
        QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
          clusterEnabled: true,
          featureCount: 0,
        ),
        isTrue,
      );
      expect(
        QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
          clusterEnabled: true,
          featureCount: 3,
        ),
        isFalse,
      );
    });
  });

  group('QalaGoMapBusinessLayerController lifecycle', () {
    late QalaGoMapBusinessLayerTestSink sink;
    late QalaGoMapBusinessLayerController controller;

    setUp(() {
      sink = QalaGoMapBusinessLayerTestSink();
      controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
        ..debugForceNativeLayerEnabled = true;
    });

    Map<String, dynamic> fc(int n) => {
          'type': 'FeatureCollection',
          'features': List.generate(
            n,
            (i) => {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [51.4 + i * 0.001, 51.22],
              },
              'properties': {'businessId': 'b$i', 'selected': 0},
            },
          ),
        };

    test('empty sync defers clustered source install', () async {
      await controller.syncBusinessGeoJson(_FakeMap(), fc(0));
      expect(sink.addSourceCalls, isEmpty);
      expect(controller.sourceInstalled, isFalse);
    });

    test('non-empty sync installs source then layers', () async {
      await controller.syncBusinessGeoJson(_FakeMap(), fc(2));
      expect(sink.addSourceCalls, hasLength(1));
      expect(sink.addSourceCalls.first.cluster, isTrue);
      expect(controller.sourceInstalled, isTrue);
      expect(controller.layersInstalled, isTrue);
      expect(sink.circleLayerIds, contains('qalago-business-clusters'));
      expect(sink.symbolLayerIds, contains('qalago-business-cluster-count'));
    });

    test('addSource failure does not mark source installed', () async {
      sink.failNextAddSource = true;
      await controller.syncBusinessGeoJson(_FakeMap(), fc(1));
      expect(controller.sourceInstalled, isFalse);
      expect(controller.layersInstalled, isFalse);
    });

    test('retry after addSource failure succeeds', () async {
      sink.failNextAddSource = true;
      await controller.syncBusinessGeoJson(_FakeMap(), fc(1));
      sink.failNextAddSource = false;
      await controller.syncBusinessGeoJson(_FakeMap(), fc(1));
      expect(controller.sourceInstalled, isTrue);
      expect(controller.layersInstalled, isTrue);
    });

    test('symbol layer failure still installs circle layers', () async {
      sink.failSymbolLayer = true;
      await controller.syncBusinessGeoJson(_FakeMap(), fc(2));
      expect(sink.circleLayerIds, contains('qalago-business-clusters'));
      expect(sink.circleLayerIds, contains('qalago-business-unclustered'));
      expect(controller.layersInstalled, isFalse);
      sink.failSymbolLayer = false;
      await controller.syncBusinessGeoJson(_FakeMap(), fc(2));
      expect(controller.layersInstalled, isTrue);
    });

    test('style reload with successful tearDown reinstalls layers once per epoch', () async {
      await controller.syncBusinessGeoJson(_FakeMap(), fc(3));
      await controller.onStyleLoaded(_FakeMap());
      expect(
        QalaGoMapBusinessGeoJsonSource.featureCount(
          controller.latestFeatureCollection!,
        ),
        3,
      );
      expect(
        sink.countLayerAdds(QalaGoMapBusinessLayerIds.clusterCircles),
        2,
      );
    });

    test('style reload with failed tearDown reconciles without duplicate adds', () async {
      await controller.syncBusinessGeoJson(_FakeMap(), fc(3));
      sink.failRemoveLayer = true;
      sink.failRemoveSource = true;
      await controller.onStyleLoaded(_FakeMap());
      expect(
        sink.countLayerAdds(QalaGoMapBusinessLayerIds.clusterCircles),
        1,
      );
      expect(controller.layersInstalled, isTrue);
    });

    test('setGeoJsonSource updates after initial install', () async {
      await controller.syncBusinessGeoJson(_FakeMap(), fc(1));
      await controller.syncBusinessGeoJson(_FakeMap(), fc(4));
      expect(sink.setGeoJsonCalls, hasLength(2));
      expect(
        QalaGoMapBusinessGeoJsonSource.featureCount(sink.setGeoJsonCalls.last),
        4,
      );
    });
  });

  group('computeLayersInstalledFlag', () {
    test('requires all cluster layers when clustering enabled', () {
      expect(
        QalaGoMapBusinessLayerController.computeLayersInstalledFlag(
          clusterEnabled: true,
          clusterCirclesOk: true,
          clusterCountOk: false,
          unclusteredOk: true,
          selectedOk: true,
        ),
        isFalse,
      );
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}
