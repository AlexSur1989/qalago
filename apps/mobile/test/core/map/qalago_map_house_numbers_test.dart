import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_commercial_poi_policy.dart';
import 'package:qalago_mobile/core/map/qalago_map_house_numbers.dart';
import 'package:qalago_mobile/core/map/qalago_map_house_numbers_policy.dart';
import 'package:qalago_mobile/core/map/qalago_map_style_mutation_sink.dart';

void main() {
  group('QalaGoMapHouseNumbersPolicy', () {
    test('stable layer id and openmaptiles housenumber source', () {
      expect(QalaGoMapHouseNumbersPolicy.layerId, 'qalago-housenumber');
      expect(QalaGoMapHouseNumbersPolicy.vectorSourceId, 'openmaptiles');
      expect(QalaGoMapHouseNumbersPolicy.sourceLayer, 'housenumber');
    });

    test('text field uses housenumber property only', () {
      expect(
        QalaGoMapHouseNumbersPolicy.textFieldExpression(),
        ['get', 'housenumber'],
      );
    });

    test('global minzoom at z16+', () {
      expect(QalaGoMapHouseNumbersPolicy.minZoom, 16.0);
    });

    test('conservative collision policy', () {
      expect(QalaGoMapHouseNumbersPolicy.isCityAgnostic, isTrue);
    });

    test('commercial hardening does not target housenumber layer id', () {
      for (final id in QalaGoMapCommercialPoiPolicy.libertyMixedPoiLayerIds) {
        expect(id, isNot(QalaGoMapHouseNumbersPolicy.layerId));
      }
    });

    test('no city dependency in source files', () {
      final source =
          File('lib/core/map/qalago_map_house_numbers_policy.dart').readAsStringSync();
      expect(source.toLowerCase(), isNot(contains('uralsk')));
    });
  });

  group('QalaGoMapHouseNumbers', () {
    late _RecordingSink sink;
    late QalaGoMapHouseNumbers houseNumbers;

    setUp(() {
      sink = _RecordingSink(
        layerIds: ['building', 'highway-name-path', 'label_city'],
      );
      houseNumbers = QalaGoMapHouseNumbers(sinkForTesting: sink);
    });

    test('installs symbol layer once per style load', () async {
      houseNumbers.beginStyleLoad();
      final result = await houseNumbers.apply(_FakeMap());
      expect(result.installResult, HouseNumbersInstallResult.installed);
      expect(sink.addCalls, 1);
      expect(sink.lastMinZoom, 16.0);
      expect(sink.lastTextAllowOverlap, isFalse);
      expect(sink.lastBelowLayerId, 'highway-name-path');
    });

    test('missing openmaptiles source skips gracefully', () async {
      sink.sourceIds = ['custom'];
      houseNumbers.beginStyleLoad();
      final result = await houseNumbers.apply(_FakeMap());
      expect(result.installResult, HouseNumbersInstallResult.skippedMissingSource);
      expect(sink.addCalls, 0);
    });

    test('installation failure does not throw', () async {
      sink.failInstall = true;
      houseNumbers.beginStyleLoad();
      final result = await houseNumbers.apply(_FakeMap());
      expect(result.installResult, HouseNumbersInstallResult.failed);
      expect(result.completed, isTrue);
    });

    test('style reload reinstalls layer', () async {
      houseNumbers.beginStyleLoad();
      await houseNumbers.apply(_FakeMap());
      houseNumbers.beginStyleLoad();
      await houseNumbers.apply(_FakeMap());
      expect(sink.addCalls, 2);
      expect(sink.removeCalls, greaterThanOrEqualTo(1));
    });

    test('duplicate apply within same load is idempotent', () async {
      houseNumbers.beginStyleLoad();
      await houseNumbers.apply(_FakeMap());
      final second = await houseNumbers.apply(_FakeMap());
      expect(second.skippedAlreadyApplied, isTrue);
      expect(sink.addCalls, 1);
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _RecordingSink implements QalaGoMapStyleMutationSink {
  _RecordingSink({this.layerIds = const []});

  List<String> layerIds;
  List<String> sourceIds = ['openmaptiles'];
  int addCalls = 0;
  int removeCalls = 0;
  bool failInstall = false;
  double? lastMinZoom;
  bool? lastTextAllowOverlap;
  String? lastBelowLayerId;

  @override
  Future<List<String>> getLayerIds() async => layerIds;

  @override
  Future<List<String>> getSourceIds() async => sourceIds;

  @override
  Future<void> setLayerProperties(
    String layerId,
    LayerProperties properties,
  ) async {}

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
  }) async {
    if (failInstall) {
      throw PlatformException(code: 'layer', message: 'test fail');
    }
    addCalls++;
    lastMinZoom = minzoom;
    lastTextAllowOverlap = properties.textAllowOverlap as bool?;
    lastBelowLayerId = belowLayerId;
    expect(sourceId, 'openmaptiles');
    expect(sourceLayer, 'housenumber');
    expect(layerId, 'qalago-housenumber');
  }

  @override
  Future<void> removeLayer(String layerId) async {
    removeCalls++;
  }
}
