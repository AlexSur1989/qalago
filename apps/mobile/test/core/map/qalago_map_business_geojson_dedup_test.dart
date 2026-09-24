import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_geojson_fingerprint.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_business_layer_controller.dart';
import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/shared/models/models.dart';
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

  BusinessModel biz({
    required String id,
    String? locationId,
    double lat = 51.22,
    double lng = 51.39,
    String? categoryId,
    String? categoryTitle,
  }) =>
      BusinessModel(
        id: id,
        locationId: locationId ?? 'loc-$id',
        title: 'T',
        slug: 's-$id',
        address: 'A',
        latitude: lat,
        longitude: lng,
        categoryId: categoryId,
        categoryTitle: categoryTitle,
      );

  Map<String, dynamic> cloneMap(Map<String, dynamic> source) {
    return Map<String, dynamic>.from(source)
      ..['features'] = (source['features'] as List)
          .map((f) => Map<String, dynamic>.from(f as Map))
          .toList();
  }

  test('A same semantic payload new Map instance skips second setGeoJson', () async {
    final payload = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1')],
    );
    await controller.syncBusinessGeoJson(
      map,
      payload.featureCollection,
      contentFingerprint: payload.contentFingerprint,
    );
    final clone = cloneMap(payload.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      clone,
      contentFingerprint: payload.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(1));
  });

  test('C coordinate change triggers update', () async {
    final a = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1', lat: 51.0, lng: 51.0)],
    );
    final b = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1', lat: 51.1, lng: 51.0)],
    );
    await syncBusinessGeoJsonForTest(controller, map, a.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      b.featureCollection,
      contentFingerprint: b.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
  });

  test('D locationId change triggers update', () async {
    final a = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1', locationId: 'loc-a')],
    );
    final b = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1', locationId: 'loc-b')],
    );
    await syncBusinessGeoJsonForTest(controller, map, a.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      b.featureCollection,
      contentFingerprint: b.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
  });

  test('F deselection triggers update', () async {
    final businesses = [biz(id: 'b1')];
    final selected = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: businesses,
      selectedLocationId: 'loc-b1',
    );
    final unselected = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: businesses,
    );
    await syncBusinessGeoJsonForTest(controller, map, selected.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      unselected.featureCollection,
      contentFingerprint: unselected.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
  });

  test('E selection change triggers update', () async {
    final businesses = [biz(id: 'b1')];
    final unselected = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: businesses,
    );
    final selected = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: businesses,
      selectedLocationId: 'loc-b1',
    );
    await syncBusinessGeoJsonForTest(controller, map, unselected.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      selected.featureCollection,
      contentFingerprint: selected.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
    expect(unselected.contentFingerprint, isNot(selected.contentFingerprint));
  });

  test('G business added triggers update', () async {
    final a = BusinessMapGeoJsonBuilder.buildPayload(businesses: [biz(id: '1')]);
    final b = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: '1'), biz(id: '2')],
    );
    await syncBusinessGeoJsonForTest(controller, map, a.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      b.featureCollection,
      contentFingerprint: b.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
  });

  test('H business removed triggers update', () async {
    final a = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: '1'), biz(id: '2')],
    );
    final b = BusinessMapGeoJsonBuilder.buildPayload(businesses: [biz(id: '1')]);
    await syncBusinessGeoJsonForTest(controller, map, a.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      b.featureCollection,
      contentFingerprint: b.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(2));
  });

  test('I style reload replays same fingerprint on new epoch', () async {
    final payload = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1')],
    );
    await syncBusinessGeoJsonForTest(controller, map, payload.featureCollection);
    await controller.onStyleLoaded(map);
    expect(sink.setGeoJsonCalls, hasLength(2));
    expect(controller.appliedGeoJsonEpoch, controller.styleEpoch);
  });

  test('J setGeoJson failure does not commit fingerprint then retry succeeds', () async {
    final payload = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1')],
    );
    sink.failSetGeoJson = true;
    await controller.syncBusinessGeoJson(
      map,
      payload.featureCollection,
      contentFingerprint: payload.contentFingerprint,
    ).catchError((_) {});
    expect(controller.appliedGeoJsonFingerprint, isNull);
    sink.failSetGeoJson = false;
    await controller.syncBusinessGeoJson(
      map,
      payload.featureCollection,
      contentFingerprint: payload.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(1));
    expect(controller.appliedGeoJsonFingerprint, payload.contentFingerprint);
  });

  test('L empty to non-empty transition applies geojson', () async {
    final empty = BusinessMapGeoJsonBuilder.buildPayload(businesses: []);
    final one = BusinessMapGeoJsonBuilder.buildPayload(businesses: [biz(id: '1')]);
    await controller.syncBusinessGeoJson(
      map,
      empty.featureCollection,
      contentFingerprint: empty.contentFingerprint,
    );
    expect(sink.addSourceCalls, isEmpty);
    await controller.syncBusinessGeoJson(
      map,
      one.featureCollection,
      contentFingerprint: one.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, isNotEmpty);
  });

  test('K style epoch reset replays then per-epoch dedup does not suppress new epoch', () async {
    final payload = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1')],
    );
    await syncBusinessGeoJsonForTest(
      controller,
      map,
      payload.featureCollection,
    );
    expect(controller.appliedGeoJsonEpoch, 0);
    await controller.onStyleLoaded(map);
    expect(controller.appliedGeoJsonEpoch, 1);
    expect(controller.appliedGeoJsonFingerprint, payload.contentFingerprint);
    expect(sink.setGeoJsonCalls, hasLength(2));
    final callsAfterStyle = sink.setGeoJsonCalls.length;
    await syncBusinessGeoJsonForTest(
      controller,
      map,
      payload.featureCollection,
    );
    expect(sink.setGeoJsonCalls.length, callsAfterStyle);
  });

  test('B unrelated rebuild same businesses keeps fingerprint stable', () {
    final businesses = [biz(id: 'b1'), biz(id: 'b2')];
    final first = BusinessMapGeoJsonBuilder.buildPayload(businesses: businesses);
    final second = BusinessMapGeoJsonBuilder.buildPayload(businesses: businesses);
    expect(first.contentFingerprint, second.contentFingerprint);
    expect(
      identical(first.featureCollection, second.featureCollection),
      isFalse,
    );
  });

  test('M native feature flag false skips business geojson sync', () async {
    final disabled = QalaGoMapBusinessLayerController(sinkForTesting: sink);
    final payload = BusinessMapGeoJsonBuilder.buildPayload(
      businesses: [biz(id: 'b1')],
    );
    await disabled.syncBusinessGeoJson(
      map,
      payload.featureCollection,
      contentFingerprint: payload.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, isEmpty);
    expect(disabled.appliedGeoJsonFingerprint, isNull);
  });

  test('1000-feature same fingerprint skips redundant setGeoJson', () async {
    final businesses = List.generate(
      1000,
      (i) => biz(id: 'b$i', locationId: 'loc$i', lat: 51 + i * 0.0001, lng: 51.2),
    );
    final payload = BusinessMapGeoJsonBuilder.buildPayload(businesses: businesses);
    await syncBusinessGeoJsonForTest(controller, map, payload.featureCollection);
    final clone = cloneMap(payload.featureCollection);
    await controller.syncBusinessGeoJson(
      map,
      clone,
      contentFingerprint: payload.contentFingerprint,
    );
    expect(sink.setGeoJsonCalls, hasLength(1));
    expect(
      QalaGoMapBusinessGeoJsonFingerprint.fromFeatureCollection(payload.featureCollection),
      payload.contentFingerprint,
    );
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}
