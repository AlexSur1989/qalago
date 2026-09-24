import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_sink.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_user_location_layer_ids.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_user_location_layer_controller.dart';

void main() {
  group('QalaGoMapUserLocationLayerController', () {
    late _RecordingSink sink;
    late QalaGoMapUserLocationLayerController controller;

    setUp(() {
      sink = _RecordingSink();
      controller = QalaGoMapUserLocationLayerController(sinkForTesting: sink);
    });

    test('onStyleLoaded installs non-clustered source and circle layer', () async {
      await controller.onStyleLoaded(_FakeMap(), userLocation: null);
      expect(sink.addSourceCalls, hasLength(1));
      expect(sink.addSourceCalls.first.cluster, isFalse);
      expect(sink.circleLayerIds, contains(QalaGoMapUserLocationLayerIds.circle));
      expect(controller.sourceInstalled, isTrue);
      expect(controller.layerInstalled, isTrue);
    });

    test('null location clears source to empty collection', () async {
      await controller.onStyleLoaded(_FakeMap(), userLocation: null);
      await controller.syncUserLocation(_FakeMap(), null);
      expect(sink.setGeoJsonCalls.last['features'], isEmpty);
    });

    test('valid location sets one Point', () async {
      await controller.onStyleLoaded(_FakeMap(), userLocation: null);
      const position = QalaGoMapCoordinate(latitude: 51.1, longitude: 51.2);
      await controller.syncUserLocation(_FakeMap(), position);
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features, hasLength(1));
      expect(
        features.first['geometry']['coordinates'],
        [51.2, 51.1],
      );
    });

    test('coordinate update replaces Point', () async {
      await controller.onStyleLoaded(_FakeMap(), userLocation: null);
      await controller.syncUserLocation(
        _FakeMap(),
        const QalaGoMapCoordinate(latitude: 1, longitude: 2),
      );
      await controller.syncUserLocation(
        _FakeMap(),
        const QalaGoMapCoordinate(latitude: 3, longitude: 4),
      );
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features.first['geometry']['coordinates'], [4, 3]);
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _RecordingSink implements QalaGoMapBusinessLayerSink {
  final addSourceCalls = <GeojsonSourceProperties>[];
  final setGeoJsonCalls = <Map<String, dynamic>>[];
  final circleLayerIds = <String>[];

  @override
  Future<void> addSource(String sourceId, GeojsonSourceProperties properties) async {
    addSourceCalls.add(properties);
  }

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
  }) async {
    circleLayerIds.add(layerId);
  }

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    List<Object>? filter,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<void> removeLayer(String layerId) async {}

  @override
  Future<void> removeSource(String sourceId) async {}

  @override
  Future<List<String>> getLayerIds() async => circleLayerIds;

  @override
  Future<List<String>> getSourceIds() async =>
      addSourceCalls.isEmpty ? [] : ['qalago-user-location'];
}
