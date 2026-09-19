import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_house_numbers.dart';
import 'package:qalago_mobile/core/map/qalago_map_house_numbers_policy.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_policy.dart';
import 'package:qalago_mobile/core/map/qalago_map_style_mutation_sink.dart';

void main() {
  group('C.6F.2 FIX 1 street labels', () {
    test('QalaGo Light does not mutate Liberty street/road symbol layers', () {
      for (final id in QalaGoMapLightStylePolicy.libertyStreetRoadLabelLayerIds) {
        expect(
          QalaGoMapLightStylePolicy.explicitTargetLayerIds,
          isNot(contains(id)),
        );
        expect(
          QalaGoMapLightStylePolicy.propertiesForLayer(id),
          isNull,
        );
      }
    });

    test('preserved navigation symbol layers are excluded from paint mutations', () {
      expect(
        QalaGoMapLightStylePolicy.preservedSymbolNavigationLayerIds,
        contains('highway-name-minor'),
      );
      expect(
        QalaGoMapLightStylePolicy.propertiesForLayer('highway-name-minor'),
        isNull,
      );
    });

    test('housenumber inserts below street label stack when anchor exists', () {
      final anchor = QalaGoMapHouseNumbersPolicy.resolveBelowStreetLabelsLayerId(
        ['building', 'highway-name-path', 'label_city'],
      );
      expect(anchor, 'highway-name-path');
    });

    test('missing street anchor returns null for graceful fallback', () {
      expect(
        QalaGoMapHouseNumbersPolicy.resolveBelowStreetLabelsLayerId(['water']),
        isNull,
      );
    });

    test('house numbers install with belowLayerId before business layers', () async {
      final sink = _HouseSink(
        layerIds: ['poi_r1', 'highway-name-path', 'label_city'],
      );
      final houseNumbers = QalaGoMapHouseNumbers(sinkForTesting: sink);
      houseNumbers.beginStyleLoad();
      await houseNumbers.apply(_FakeMap());
      expect(sink.lastBelowLayerId, 'highway-name-path');
    });

    test('no coordinate transform or snapping in housenumber policy', () {
      final source =
          File('lib/core/map/qalago_map_house_numbers.dart').readAsStringSync();
      final policy =
          File('lib/core/map/qalago_map_house_numbers_policy.dart').readAsStringSync();
      for (final forbidden in [
        'textOffset',
        'textTranslate',
        'snap',
        'nearest',
        'geocode',
        'default',
      ]) {
        expect(source.contains(forbidden), isFalse, reason: forbidden);
        if (forbidden != 'default') {
          expect(policy.contains(forbidden), isFalse, reason: forbidden);
        }
      }
      expect(
        QalaGoMapHouseNumbersPolicy.textFieldExpression(),
        ['get', 'housenumber'],
      );
    });

    test('style lifecycle keeps business layers after housenumber', () {
      final mapView = File(
        'lib/core/map/providers/maplibre_qalago_map_view.dart',
      ).readAsStringSync();
      final house = mapView.indexOf('_houseNumbers.apply');
      final business = mapView.indexOf('_businessLayerController.onStyleLoaded');
      expect(house, greaterThan(0));
      expect(business, greaterThan(house));
    });
  });
}

class _FakeMap extends Fake implements MapLibreMapController {}

class _HouseSink implements QalaGoMapStyleMutationSink {
  _HouseSink({required this.layerIds});

  final List<String> layerIds;
  String? lastBelowLayerId;

  @override
  Future<List<String>> getLayerIds() async => layerIds;

  @override
  Future<List<String>> getSourceIds() async => ['openmaptiles'];

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
    lastBelowLayerId = belowLayerId;
  }

  @override
  Future<void> removeLayer(String layerId) async {}
}
