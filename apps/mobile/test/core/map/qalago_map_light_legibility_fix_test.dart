import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_paint_merge.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_policy.dart';

void main() {
  group('C.6F.2 FIX 2 legibility', () {
    test('building fill is stronger than previous C.6F.2 token', () {
      expect(
        QalaGoMapLightStylePolicy.buildingFillColor,
        isNot(QalaGoMapLightStylePolicy.previousBuildingFillColor),
      );
      expect(QalaGoMapLightStylePolicy.buildingFillColor, '#DDE3E8');
    });

    test('road hierarchy width scales differ by class', () {
      expect(
        QalaGoMapLightStylePolicy.lineWidthScaleFor('road_minor'),
        greaterThan(
          QalaGoMapLightStylePolicy.lineWidthScaleFor('road_motorway'),
        ),
      );
      expect(
        QalaGoMapLightStylePolicy.lineWidthScaleFor('road_secondary_tertiary'),
        greaterThan(
          QalaGoMapLightStylePolicy.lineWidthScaleFor('road_motorway'),
        ),
      );
    });

    test('mergeLinePaint preserves zoom interpolation and scales width', () {
      const base = {
        'line-color': '#fff',
        'line-width': [
          'interpolate',
          ['exponential', 1.2],
          ['zoom'],
          13.5,
          0,
          14,
          2.5,
          20,
          18,
        ],
      };
      final merged = QalaGoMapLightStylePaintMerge.mergeLinePaint(
        basePaint: base,
        lineColor: '#D4D8DE',
        widthScale: 1.32,
      );
      expect(merged['line-color'], '#D4D8DE');
      expect(merged['line-width'], isA<List>());
      expect(merged['line-width']!.first, 'interpolate');
      expect(merged['line-width']!.contains('*'), isFalse);
    });

    test('street labels use paint-only overrides not layout keys', () {
      final paint =
          QalaGoMapLightStylePolicy.streetLabelPaintFor('highway-name-minor');
      expect(paint, isNotNull);
      expect(paint!.keys, contains('text-color'));
      expect(paint.keys, isNot(contains('text-field')));
    });

    test('SymbolLayerProperties guard remains in sink', () {
      final sinkSource =
          File('lib/core/map/qalago_map_style_mutation_sink.dart').readAsStringSync();
      expect(
        sinkSource,
        contains('SymbolLayerProperties must not use setLayerProperties'),
      );
    });
  });
}
