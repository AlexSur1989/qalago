import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_policy.dart';
import 'package:qalago_mobile/core/map/qalago_map_style_mutation_sink.dart';

void main() {
  group('QalaGoMapLightStylePolicy', () {
    test('registry includes audited Liberty categories', () {
      expect(QalaGoMapLightStylePolicy.auditedLibertyLayerCount, 111);
      expect(
        QalaGoMapLightStylePolicy.explicitTargetLayerIds,
        contains('water'),
      );
      expect(
        QalaGoMapLightStylePolicy.explicitTargetLayerIds,
        contains('building'),
      );
      expect(
        QalaGoMapLightStylePolicy.explicitTargetLayerIds,
        contains('highway-name-minor'),
      );
    });

    test('is city-agnostic', () {
      expect(QalaGoMapLightStylePolicy.isCityAgnostic, isTrue);
      final source = File('lib/core/map/qalago_map_light_style_policy.dart')
          .readAsStringSync();
      for (final slug in ['uralsk', 'citySlug', 'cityId']) {
        expect(source.toLowerCase(), isNot(contains(slug)));
      }
    });
  });

  group('QalaGoMapLightStyle', () {
    late _RecordingSink sink;
    late QalaGoMapLightStyle lightStyle;

    setUp(() {
      sink = _RecordingSink(
        layerIds: ['background', 'water', 'road_minor'],
      );
      lightStyle = QalaGoMapLightStyle(sinkForTesting: sink);
    });

    test('missing cosmetic layer is graceful', () async {
      lightStyle.beginStyleLoad();
      final result = await lightStyle.apply(_FakeMap());
      expect(
        result.layerResults['building'],
        LightStyleLayerResult.skippedMissing,
      );
      expect(result.layerResults['water'], LightStyleLayerResult.applied);
    });

    test('one mutation failure does not stop remaining layers', () async {
      sink.failOnLayer = 'water';
      lightStyle.beginStyleLoad();
      final result = await lightStyle.apply(_FakeMap());
      expect(result.layerResults['water'], LightStyleLayerResult.failed);
      expect(result.layerResults['background'], LightStyleLayerResult.applied);
    });

    test('style reload reapplies mutations', () async {
      lightStyle.beginStyleLoad();
      await lightStyle.apply(_FakeMap());
      final first = sink.mutationCount;
      lightStyle.beginStyleLoad();
      await lightStyle.apply(_FakeMap());
      expect(sink.mutationCount, greaterThan(first));
    });

    test('duplicate apply within same style load is idempotent', () async {
      lightStyle.beginStyleLoad();
      await lightStyle.apply(_FakeMap());
      final countAfterFirst = sink.mutationCount;
      final second = await lightStyle.apply(_FakeMap());
      expect(second.skippedAlreadyApplied, isTrue);
      expect(sink.mutationCount, countAfterFirst);
    });

    test('custom style without Liberty layers completes', () async {
      sink.layerIds = ['custom-background'];
      lightStyle.beginStyleLoad();
      final result = await lightStyle.apply(_FakeMap());
      expect(result.completed, isTrue);
      expect(sink.mutationCount, 0);
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _RecordingSink implements QalaGoMapStyleMutationSink {
  _RecordingSink({required this.layerIds});

  List<String> layerIds;
  int mutationCount = 0;
  String? failOnLayer;

  @override
  Future<List<String>> getLayerIds() async => layerIds;

  @override
  Future<List<String>> getSourceIds() async => ['openmaptiles'];

  @override
  Future<void> setLayerProperties(
    String layerId,
    LayerProperties properties,
  ) async {
    if (failOnLayer == layerId) {
      throw PlatformException(code: 'paint', message: 'test fail');
    }
    mutationCount++;
  }

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    String? belowLayerId,
    String? sourceLayer,
    double? minzoom,
    double? maxzoom,
    filter,
  }) async {}

  @override
  Future<void> removeLayer(String layerId) async {}
}
