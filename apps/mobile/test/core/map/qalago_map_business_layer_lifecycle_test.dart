import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_business_layer_controller.dart';
import 'qalago_map_business_layer_test_sink.dart';

void main() {
  late QalaGoMapBusinessLayerTestSink sink;
  late QalaGoMapBusinessLayerController controller;
  late _FakeMap map;

  setUp(() {
    sink = QalaGoMapBusinessLayerTestSink();
    controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
      ..debugForceNativeLayerEnabled = true;
    map = _FakeMap();
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

  test('A repeated ensure/install adds each layer once', () async {
    await controller.syncBusinessGeoJson(map, fc(2));
    await controller.ensureLayers(map);
    expect(sink.countLayerAdds(QalaGoMapBusinessLayerIds.clusterCircles), 1);
    expect(sink.countLayerAdds(QalaGoMapBusinessLayerIds.selected), 1);
  });

  test('B concurrent sync does not duplicate layer adds', () async {
    await Future.wait([
      controller.syncBusinessGeoJson(map, fc(2)),
      controller.syncBusinessGeoJson(map, fc(3)),
    ]);
    for (final layerId in [
      QalaGoMapBusinessLayerIds.clusterCircles,
      QalaGoMapBusinessLayerIds.clusterCount,
      QalaGoMapBusinessLayerIds.unclustered,
      QalaGoMapBusinessLayerIds.selected,
    ]) {
      expect(sink.countLayerAdds(layerId), 1);
    }
  });

  test('C sync concurrent with style installation converges', () async {
    final first = controller.onStyleLoaded(map);
    final second = controller.syncBusinessGeoJson(map, fc(5));
    await Future.wait([first, second]);
    expect(controller.sourceInstalled, isTrue);
    expect(controller.layersInstalled, isTrue);
    expect(sink.setGeoJsonCalls, isNotEmpty);
    expect(
      sink.countLayerAdds(QalaGoMapBusinessLayerIds.unclustered),
      1,
    );
  });

  test('D style load + immediate sync race yields one stack', () async {
    await Future.wait([
      controller.onStyleLoaded(map),
      controller.syncBusinessGeoJson(map, fc(3)),
    ]);
    expect(controller.layersInstalled, isTrue);
    expect(sink.hasBusinessSource, isTrue);
  });

  test('E style reload replays latest GeoJSON on new epoch', () async {
    await controller.syncBusinessGeoJson(map, fc(2));
    await controller.syncBusinessGeoJson(map, fc(7));
    final epochBefore = controller.styleEpoch;
    await controller.onStyleLoaded(map);
    expect(controller.styleEpoch, greaterThan(epochBefore));
    expect(controller.latestFeatureCollection!['features'], hasLength(7));
  });

  test('F teardown remove failure reconciles without duplicate adds', () async {
    await controller.syncBusinessGeoJson(map, fc(2));
    sink.failRemoveLayer = true;
    sink.failRemoveSource = true;
    await controller.onStyleLoaded(map);
    expect(controller.layersInstalled, isTrue);
    expect(
      sink.countLayerAdds(QalaGoMapBusinessLayerIds.clusterCircles),
      1,
    );
  });

  test('G already exists PlatformException reconciles as installed', () async {
    await controller.syncBusinessGeoJson(map, fc(1));
    sink.duplicateAddThrows = true;
    // Manually simulate native retention without remove on reload.
    sink.failRemoveLayer = true;
    sink.failRemoveSource = true;
    await controller.onStyleLoaded(map);
    expect(controller.layersInstalled, isTrue);
  });

  test('H unrelated PlatformException is not treated as installed', () async {
    sink.failNextAddSource = true;
    await controller.syncBusinessGeoJson(map, fc(1));
    expect(controller.sourceInstalled, isFalse);
    expect(controller.layersInstalled, isFalse);
  });

  test('I partial symbol failure then retry completes stack once per layer', () async {
    sink.failSymbolLayer = true;
    await controller.syncBusinessGeoJson(map, fc(2));
    expect(controller.layersInstalled, isFalse);
    final circlesBefore = sink.countLayerAdds(
      QalaGoMapBusinessLayerIds.clusterCircles,
    );
    sink.failSymbolLayer = false;
    await controller.syncBusinessGeoJson(map, fc(2));
    expect(controller.layersInstalled, isTrue);
    expect(
      sink.countLayerAdds(QalaGoMapBusinessLayerIds.clusterCircles),
      circlesBefore,
    );
  });

  test('J dispose prevents follow-up install state', () async {
    await controller.syncBusinessGeoJson(map, fc(2));
    controller.dispose();
    await controller.syncBusinessGeoJson(map, fc(2));
    expect(controller.sourceInstalled, isFalse);
    expect(controller.layersInstalled, isFalse);
  });

  test('K selection sync during install converges without duplicate layers', () async {
    await Future.wait([
      controller.onStyleLoaded(map),
      controller.syncBusinessGeoJson(map, fc(4)),
      controller.syncBusinessGeoJson(
        map,
        fc(4),
      ),
    ]);
    expect(controller.layersInstalled, isTrue);
    expect(
      sink.countLayerAdds(QalaGoMapBusinessLayerIds.selected),
      1,
    );
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}
