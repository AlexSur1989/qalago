import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_basemap_hardening.dart';
import 'package:qalago_mobile/core/map/qalago_map_basemap_hardening_sink.dart';
import 'package:qalago_mobile/core/map/qalago_map_commercial_poi_policy.dart';

void main() {
  group('QalaGoMapBasemapHardening', () {
    late _RecordingSink sink;
    late QalaGoMapBasemapHardening hardening;

    setUp(() {
      sink = _RecordingSink(
        layerIds: [
          'poi_r1',
          'poi_r7',
          'poi_r20',
          'poi_transit',
          'airport',
        ],
      );
      hardening = QalaGoMapBasemapHardening(sinkForTesting: sink);
    });

    void beginLoad() => hardening.beginStyleLoad();

    test('hardens all three mixed POI layers', () async {
      beginLoad();
      final result = await hardening.apply(_FakeMap());
      expect(result.layerApplied('poi_r1'), isTrue);
      expect(result.layerApplied('poi_r7'), isTrue);
      expect(result.layerApplied('poi_r20'), isTrue);
      expect(sink.setFilterInvocationCount, 3);
    });

    test('does not setFilter on poi_transit or airport', () async {
      beginLoad();
      await hardening.apply(_FakeMap());
      expect(sink.setFilterCalls.keys, contains('poi_r1'));
      expect(sink.setFilterCalls.containsKey('poi_transit'), isFalse);
      expect(sink.setFilterCalls.containsKey('airport'), isFalse);
    });

    test('missing layer is graceful', () async {
      beginLoad();
      sink.layerIds = ['poi_r1', 'poi_r7'];
      final result = await hardening.apply(_FakeMap());
      expect(result.layerResults['poi_r20'],
          BasemapLayerHardeningResult.skippedMissing);
      expect(result.layerApplied('poi_r1'), isTrue);
      expect(sink.setFilterInvocationCount, 2);
    });

    test('one layer failure does not stop others', () async {
      beginLoad();
      sink.failOnLayer = 'poi_r7';
      final result = await hardening.apply(_FakeMap());
      expect(result.layerResults['poi_r7'],
          BasemapLayerHardeningResult.failed);
      expect(result.layerApplied('poi_r1'), isTrue);
      expect(result.layerApplied('poi_r20'), isTrue);
    });

    test('new style load increments generation and runs again', () async {
      beginLoad();
      await hardening.apply(_FakeMap());
      final firstGen = hardening.styleLoadGeneration;
      beginLoad();
      await hardening.apply(_FakeMap());
      expect(hardening.styleLoadGeneration, firstGen + 1);
      expect(sink.setFilterInvocationCount, 6);
    });

    test('duplicate apply within same style load is idempotent', () async {
      beginLoad();
      await hardening.apply(_FakeMap());
      final second = await hardening.apply(_FakeMap());
      expect(second.skippedAlreadyHardened, isTrue);
      expect(sink.setFilterInvocationCount, 3);
    });

    test('custom style without POI layers completes without throws', () async {
      beginLoad();
      sink.layerIds = ['background', 'water'];
      final result = await hardening.apply(_FakeMap());
      expect(result.completed, isTrue);
      expect(sink.setFilterCalls, isEmpty);
    });

    test('merged filter retains rank band from base', () async {
      beginLoad();
      await hardening.apply(_FakeMap());
      final filter = sink.setFilterCalls['poi_r1']! as List;
      expect(filter.toString(), contains('rank'));
      expect(filter.toString(), contains('!'));
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _RecordingSink implements QalaGoMapBasemapHardeningSink {
  _RecordingSink({required this.layerIds});

  List<String> layerIds;
  final setFilterCalls = <String, Object>{};
  int setFilterInvocationCount = 0;
  String? failOnLayer;

  @override
  Future<List<String>> getLayerIds() async => layerIds;

  @override
  Future<Object?> getFilter(String layerId) async {
    return QalaGoMapCommercialPoiPolicy.libertyBaseFilters[layerId];
  }

  @override
  Future<void> setFilter(String layerId, Object filter) async {
    if (failOnLayer == layerId) {
      throw PlatformException(code: 'filter', message: 'test fail');
    }
    setFilterInvocationCount++;
    setFilterCalls[layerId] = filter;
  }
}
