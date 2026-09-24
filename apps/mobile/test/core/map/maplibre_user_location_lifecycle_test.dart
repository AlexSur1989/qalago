import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_sink.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_user_location_layer_ids.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_user_location_layer_controller.dart';

void main() {
  group('MapLibre user location lifecycle (controller contract)', () {
    late _RecordingSink sink;
    late QalaGoMapUserLocationLayerController controller;
    late _FakeMap map;

    setUp(() {
      sink = _RecordingSink();
      controller = QalaGoMapUserLocationLayerController(sinkForTesting: sink);
      map = _FakeMap();
    });

    test('style ready with null userLocation clears source', () async {
      await controller.onStyleLoaded(map, userLocation: null);
      expect(sink.setGeoJsonCalls.last['features'], isEmpty);
    });

    test('null then valid coordinate after style syncs Point', () async {
      await controller.onStyleLoaded(map, userLocation: null);
      const position = QalaGoMapCoordinate(latitude: 51.1, longitude: 51.2);
      await controller.syncUserLocation(map, position);
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features, hasLength(1));
    });

    test('valid coordinate before style replays on style ready without second GPS',
        () async {
      const position = QalaGoMapCoordinate(latitude: 51.243, longitude: 51.379);
      await controller.syncUserLocation(map, position);
      await controller.onStyleLoaded(map, userLocation: position);
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features, hasLength(1));
      expect(
        features.first['geometry']['coordinates'],
        [51.379, 51.243],
      );
    });

    test('style reload replays current widget coordinate', () async {
      const position = QalaGoMapCoordinate(latitude: 2, longitude: 3);
      await controller.onStyleLoaded(map, userLocation: position);
      await controller.onStyleLoaded(map, userLocation: position);
      expect(sink.addSourceCalls.length, greaterThanOrEqualTo(2));
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features.first['geometry']['coordinates'], [3, 2]);
    });

    test('coordinate change while style ready updates GeoJSON', () async {
      await controller.onStyleLoaded(
        map,
        userLocation: const QalaGoMapCoordinate(latitude: 1, longitude: 2),
      );
      await controller.syncUserLocation(
        map,
        const QalaGoMapCoordinate(latitude: 5, longitude: 6),
      );
      final features = sink.setGeoJsonCalls.last['features'] as List<dynamic>;
      expect(features.first['geometry']['coordinates'], [6, 5]);
    });
  });

  test('MapLibreQalaGoMapView replays widget.userLocation on style load', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    expect(source, contains('userLocation: widget.userLocation'));
    expect(source, contains('oldWidget.userLocation != widget.userLocation'));
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
      addSourceCalls.isEmpty ? [] : ['test-source'];
}
