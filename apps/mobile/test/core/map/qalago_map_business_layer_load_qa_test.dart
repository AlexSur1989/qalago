import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_cluster_config.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_geojson_source.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_business_layer_controller.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_sink.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_user_location_layer_controller.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_geojson_fingerprint.dart';
import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/features/map/native_business_map_geo_json_payload.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'native_business_layer_scale_fixture.dart';
import 'qalago_map_business_layer_test_sink.dart';

/// MAP-PERF.C3.3 automated load / regression QA (dev-machine observations only).
void main() {
  final perfLog = <String, Map<String, dynamic>>{};

  int medianMicros(List<int> samples) {
    if (samples.isEmpty) {
      return 0;
    }
    final sorted = List<int>.from(samples)..sort();
    return sorted[sorted.length ~/ 2];
  }

  group('C3.3 dataset grain', () {
    test('multi-branch parents emit multiple BusinessLocation features', () {
      for (final n in NativeBusinessLayerScaleFixture.scaleCounts) {
        final payload = NativeBusinessLayerScaleFixture.buildPayload(n);
        final features = payload.featureCollection['features'] as List;
        expect(features.length, n);
        expect(
          NativeBusinessLayerScaleFixture.countUniqueLocationIds(
            payload.featureCollection,
          ),
          n,
        );
        expect(
          NativeBusinessLayerScaleFixture.countFeaturesForBusinessId(
            payload.featureCollection,
            'parent-0',
          ),
          NativeBusinessLayerScaleFixture.branchesPerParent,
        );
      }
    });
  });

  group('C3.3 payload / fingerprint scale observations', () {
    for (final n in NativeBusinessLayerScaleFixture.scaleCounts) {
      test('observe build + fingerprint at N=$n (not a pass/fail threshold)', () {
        const warmup = 2;
        const iterations = 5;
        for (var w = 0; w < warmup; w++) {
          NativeBusinessLayerScaleFixture.buildPayload(n);
        }
        final buildSamples = <int>[];
        final fingerprintSamples = <int>[];
        NativeBusinessMapGeoJsonPayload? last;
        for (var i = 0; i < iterations; i++) {
          final sw = Stopwatch()..start();
          last = NativeBusinessLayerScaleFixture.buildPayload(n);
          sw.stop();
          buildSamples.add(sw.elapsedMicroseconds);
          final features = (last!.featureCollection['features'] as List)
              .cast<Map<String, dynamic>>();
          final swFp = Stopwatch()..start();
          QalaGoMapBusinessGeoJsonFingerprint.fromFeatureMaps(features);
          swFp.stop();
          fingerprintSamples.add(swFp.elapsedMicroseconds);
        }
        final jsonBytes = utf8.encode(jsonEncode(last!.featureCollection)).length;
        perfLog['N=$n'] = {
          'buildPayloadMedianUs': medianMicros(buildSamples),
          'buildPayloadMaxUs': buildSamples.reduce(max),
          'fingerprintMedianUs': medianMicros(fingerprintSamples),
          'fingerprintMaxUs': fingerprintSamples.reduce(max),
          'payloadUtf8Bytes': jsonBytes,
          'featureCount': n,
        };
        expect(jsonBytes, greaterThan(1000));
      });
    }

    tearDownAll(() {
      // Dev-machine timing log for C3.3 report (not Samsung benchmarks).
      for (final entry in perfLog.entries) {
        // ignore: avoid_print
        print('C3.3_PERF ${entry.key} ${entry.value}');
      }
    });
  });

  group('C3.3 semantic dedup at scale', () {
    for (final n in NativeBusinessLayerScaleFixture.scaleCounts) {
      test('N=$n initial sync once then 20 same-semantic clones', () async {
        final sink = QalaGoMapBusinessLayerTestSink();
        final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
          ..debugForceNativeLayerEnabled = true;
        final map = _FakeMap();
        final payload = NativeBusinessLayerScaleFixture.buildPayload(n);

        await controller.syncBusinessGeoJson(
          map,
          payload.featureCollection,
          contentFingerprint: payload.contentFingerprint,
        );
        expect(sink.setGeoJsonCalls, hasLength(1));

        for (var r = 0; r < 20; r++) {
          final clone = NativeBusinessLayerScaleFixture.cloneFeatureCollection(
            payload.featureCollection,
          );
          await controller.syncBusinessGeoJson(
            map,
            clone,
            contentFingerprint: payload.contentFingerprint,
          );
        }
        expect(sink.setGeoJsonCalls, hasLength(1));
      });
    }
  });

  group('C3.3 content change at scale', () {
    for (final n in NativeBusinessLayerScaleFixture.scaleCounts) {
      test('N=$n one coordinate change then dedup', () async {
        final sink = QalaGoMapBusinessLayerTestSink();
        final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
          ..debugForceNativeLayerEnabled = true;
        final map = _FakeMap();
        final base = NativeBusinessLayerScaleFixture.buildPayload(n);
        await syncBusinessGeoJsonForTest(
          controller,
          map,
          base.featureCollection,
        );
        final businesses = NativeBusinessLayerScaleFixture.businessLocations(n);
        final first = businesses.first;
        final changed = BusinessMapGeoJsonBuilder.buildPayload(
          businesses: [
            BusinessModel(
              id: first.id,
              locationId: first.locationId,
              title: first.title,
              slug: first.slug,
              address: first.address,
              latitude: first.latitude! + 0.0001,
              longitude: first.longitude,
              categoryId: first.categoryId,
              categoryTitle: first.categoryTitle,
            ),
            ...businesses.skip(1),
          ],
        );
        expect(changed.contentFingerprint, isNot(base.contentFingerprint));
        await controller.syncBusinessGeoJson(
          map,
          changed.featureCollection,
          contentFingerprint: changed.contentFingerprint,
        );
        expect(sink.setGeoJsonCalls, hasLength(2));
        await controller.syncBusinessGeoJson(
          map,
          NativeBusinessLayerScaleFixture.cloneFeatureCollection(
            changed.featureCollection,
          ),
          contentFingerprint: changed.contentFingerprint,
        );
        expect(sink.setGeoJsonCalls, hasLength(2));
      });
    }
  });

  group('C3.3 selection stress', () {
    for (final n in [1000, 3000]) {
      test('N=$n selection sequence one native update per transition', () async {
        final sink = QalaGoMapBusinessLayerTestSink();
        final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
          ..debugForceNativeLayerEnabled = true;
        final map = _FakeMap();
        final businesses = NativeBusinessLayerScaleFixture.businessLocations(n);

        Future<void> syncSelection(String? selectedLocationId) async {
          final payload = BusinessMapGeoJsonBuilder.buildPayload(
            businesses: businesses,
            selectedLocationId: selectedLocationId,
          );
          await controller.syncBusinessGeoJson(
            map,
            payload.featureCollection,
            contentFingerprint: payload.contentFingerprint,
          );
        }

        await syncSelection(null);
        final afterInitial = sink.setGeoJsonCalls.length;

        await syncSelection(
          NativeBusinessLayerScaleFixture.selectionLocationA(n),
        );
        await syncSelection(
          NativeBusinessLayerScaleFixture.selectionLocationB(n),
        );
        await syncSelection(
          NativeBusinessLayerScaleFixture.selectionLocationC(n),
        );
        await syncSelection(null);
        await syncSelection(
          NativeBusinessLayerScaleFixture.selectionLocationA(n),
        );
        expect(sink.setGeoJsonCalls.length, afterInitial + 5);

        await syncSelection(
          NativeBusinessLayerScaleFixture.selectionLocationA(n),
        );
        expect(sink.setGeoJsonCalls.length, afterInitial + 5);

        expect(
          sink.countLayerAdds(QalaGoMapBusinessLayerIds.selected),
          1,
        );
      });
    }
  });

  group('C3.3 style reload stress (N=3000)', () {
    test('10 style epochs replay GeoJSON once per epoch', () async {
      final sink = QalaGoMapBusinessLayerTestSink();
      final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
        ..debugForceNativeLayerEnabled = true;
      final map = _FakeMap();
      const n = 3000;
      final payload = NativeBusinessLayerScaleFixture.buildPayload(n);

      await syncBusinessGeoJsonForTest(
        controller,
        map,
        payload.featureCollection,
      );
      await controller.syncBusinessGeoJson(
        map,
        NativeBusinessLayerScaleFixture.cloneFeatureCollection(
          payload.featureCollection,
        ),
        contentFingerprint: payload.contentFingerprint,
      );
      expect(sink.setGeoJsonCalls, hasLength(1));

      for (var cycle = 0; cycle < 10; cycle++) {
        await controller.onStyleLoaded(map);
        await controller.syncBusinessGeoJson(
          map,
          NativeBusinessLayerScaleFixture.cloneFeatureCollection(
            payload.featureCollection,
          ),
          contentFingerprint: payload.contentFingerprint,
        );
        await _expectFinalLayerStack(sink);
      }
      expect(sink.setGeoJsonCalls, hasLength(11));
      expect(controller.appliedGeoJsonEpoch, controller.styleEpoch);
    });
  });

  group('C3.3 concurrent sync stress (N=3000)', () {
    test('interleaved style load and payload sync converges', () async {
      final sink = QalaGoMapBusinessLayerTestSink();
      final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
        ..debugForceNativeLayerEnabled = true;
      final map = _FakeMap();
      const n = 3000;
      final payloadA = NativeBusinessLayerScaleFixture.buildPayload(n);
      final businesses = NativeBusinessLayerScaleFixture.businessLocations(n);
      final payloadB = BusinessMapGeoJsonBuilder.buildPayload(
        businesses: businesses,
        selectedLocationId:
            NativeBusinessLayerScaleFixture.selectionLocationA(n),
      );

      for (var round = 0; round < 3; round++) {
        await Future.wait([
          controller.onStyleLoaded(map),
          syncBusinessGeoJsonForTest(
            controller,
            map,
            payloadA.featureCollection,
          ),
          controller.syncBusinessGeoJson(
            map,
            payloadB.featureCollection,
            contentFingerprint: payloadB.contentFingerprint,
          ),
          controller.syncBusinessGeoJson(
            map,
            NativeBusinessLayerScaleFixture.cloneFeatureCollection(
              payloadB.featureCollection,
            ),
            contentFingerprint: payloadB.contentFingerprint,
          ),
        ]);
        await _expectFinalLayerStack(sink);
        expect(controller.layersInstalled, isTrue);
      }
      expect(
        controller.appliedGeoJsonFingerprint,
        payloadB.contentFingerprint,
      );
    });
  });

  group('C3.3 partial failure recovery (N=3000)', () {
    test('injected failures remain retryable without duplicate final stack', () async {
      final sink = QalaGoMapBusinessLayerTestSink();
      final controller = QalaGoMapBusinessLayerController(sinkForTesting: sink)
        ..debugForceNativeLayerEnabled = true;
      final map = _FakeMap();
      final payload = NativeBusinessLayerScaleFixture.buildPayload(3000);

      sink.failNextAddSource = true;
      await controller
          .syncBusinessGeoJson(
            map,
            payload.featureCollection,
            contentFingerprint: payload.contentFingerprint,
          )
          .catchError((_) {});
      sink.failNextAddSource = false;
      await syncBusinessGeoJsonForTest(
        controller,
        map,
        payload.featureCollection,
      );

      sink.failSymbolLayer = true;
      await controller.onStyleLoaded(map);
      sink.failSymbolLayer = false;
      await controller.ensureLayers(map);

      final committed = controller.appliedGeoJsonFingerprint;
      expect(committed, payload.contentFingerprint);
      sink.failSetGeoJson = true;
      final businesses = NativeBusinessLayerScaleFixture.businessLocations(3000);
      final first = businesses.first;
      final changed = BusinessMapGeoJsonBuilder.buildPayload(
        businesses: [
          BusinessModel(
            id: first.id,
            locationId: first.locationId,
            title: first.title,
            slug: first.slug,
            address: first.address,
            latitude: first.latitude! + 0.0002,
            longitude: first.longitude,
            categoryId: first.categoryId,
            categoryTitle: first.categoryTitle,
          ),
          ...businesses.skip(1),
        ],
      );
      await controller
          .syncBusinessGeoJson(
            map,
            changed.featureCollection,
            contentFingerprint: changed.contentFingerprint,
          )
          .catchError((_) {});
      expect(controller.appliedGeoJsonFingerprint, committed);
      sink.failSetGeoJson = false;
      await controller.syncBusinessGeoJson(
        map,
        changed.featureCollection,
        contentFingerprint: changed.contentFingerprint,
      );
      expect(controller.appliedGeoJsonFingerprint, changed.contentFingerprint);

      sink.failRemoveLayer = true;
      await controller.onStyleLoaded(map);
      sink.failRemoveLayer = false;
      await controller.onStyleLoaded(map);

      await _expectFinalLayerStack(sink);
      expect(sink.setGeoJsonCalls, isNotEmpty);
    });
  });

  group('C3.3 user-location isolation (N=3000 business loaded)', () {
    test('20 user-location syncs do not touch business setGeoJsonSource', () async {
      final businessSink = QalaGoMapBusinessLayerTestSink();
      final businessController =
          QalaGoMapBusinessLayerController(sinkForTesting: businessSink)
            ..debugForceNativeLayerEnabled = true;
      final userSink = _UserRecordingSink();
      final userController =
          QalaGoMapUserLocationLayerController(sinkForTesting: userSink);
      final map = _FakeMap();
      final payload = NativeBusinessLayerScaleFixture.buildPayload(3000);
      await syncBusinessGeoJsonForTest(
        businessController,
        map,
        payload.featureCollection,
      );
      final businessCalls = businessSink.setGeoJsonCalls.length;
      await userController.onStyleLoaded(
        map,
        userLocation: const QalaGoMapCoordinate(latitude: 51.2, longitude: 51.38),
      );
      for (var i = 0; i < 20; i++) {
        await userController.syncUserLocation(
          map,
          QalaGoMapCoordinate(latitude: 51.2 + i * 0.0001, longitude: 51.38),
        );
      }
      expect(businessSink.setGeoJsonCalls.length, businessCalls);
      expect(userSink.setGeoJsonCalls.length, greaterThan(1));
    });
  });

  group('C3.3 cluster contract at scale', () {
    test('N=3000 source JSON cluster tuning unchanged', () {
      final payload = NativeBusinessLayerScaleFixture.buildPayload(3000);
      final json = QalaGoMapBusinessGeoJsonSource.propertiesJsonFor(
        payload.featureCollection,
      );
      expect(json['cluster'], isTrue);
      expect(json['clusterRadius'], QalaGoMapBusinessClusterConfig.clusterRadius);
      expect(json['clusterMaxZoom'], QalaGoMapBusinessClusterConfig.clusterMaxZoom);
      expect(QalaGoMapBusinessClusterConfig.clusterRadius, 55.0);
      expect(QalaGoMapBusinessClusterConfig.clusterMaxZoom, 14.0);
    });
  });
}

Future<void> _expectFinalLayerStack(QalaGoMapBusinessLayerTestSink sink) async {
  expect(sink.hasBusinessSource, isTrue);
  final layers = await sink.getLayerIds();
  expect(layers.toSet(), {
    QalaGoMapBusinessLayerIds.clusterCircles,
    QalaGoMapBusinessLayerIds.clusterCount,
    QalaGoMapBusinessLayerIds.unclustered,
    QalaGoMapBusinessLayerIds.selected,
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _UserRecordingSink implements QalaGoMapBusinessLayerSink {
  final setGeoJsonCalls = <Map<String, dynamic>>[];

  @override
  Future<void> addSource(String sourceId, GeojsonSourceProperties properties) async {}

  @override
  Future<void> setGeoJsonSource(
    String sourceId,
    Map<String, dynamic> featureCollection,
  ) async {
    setGeoJsonCalls.add(featureCollection);
  }

  @override
  Future<void> addCircleLayer(
    String sourceId,
    String layerId,
    CircleLayerProperties properties, {
    List<Object>? filter,
  }) async {}

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    List<Object>? filter,
  }) async {}

  @override
  Future<void> removeLayer(String layerId) async {}

  @override
  Future<void> removeSource(String sourceId) async {}

  @override
  Future<List<String>> getLayerIds() async => [];

  @override
  Future<List<String>> getSourceIds() async => [];
}
