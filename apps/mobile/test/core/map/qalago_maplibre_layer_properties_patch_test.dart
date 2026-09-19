import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_paint_merge.dart';
import 'package:qalago_mobile/core/map/qalago_maplibre_layer_properties_merge.dart';

void main() {
  group('C.6F.2 FIX 3 MapLibre layer properties', () {
    test('does not use private MapLibreMapController platform access', () {
      for (final path in [
        'lib/core/map/qalago_map_style_mutation_sink.dart',
        'lib/core/map/qalago_maplibre_layer_properties_merge.dart',
      ]) {
        final source = File(path).readAsStringSync();
        expect(source, isNot(contains('_maplibrePlatform')));
        expect(source, isNot(contains('as dynamic')));
        expect(source, isNot(contains('MapLibrePlatform.createInstance')));
      }
    });

    test('sink blocks SymbolLayerProperties on setLayerProperties path', () {
      final sinkSource =
          File('lib/core/map/qalago_map_style_mutation_sink.dart').readAsStringSync();
      expect(
        sinkSource,
        contains('SymbolLayerProperties must not use setLayerProperties'),
      );
      expect(sinkSource, contains('_map.setLayerProperties'));
    });

    test('symbol paint merge preserves layout fields from snapshot', () {
      final props = qalagoLayerPropertiesWithPaintOverrides(
        layerSnapshot: {
          'type': 'symbol',
          'layout': {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'symbol-placement': 'line',
          },
          'paint': {
            'text-color': '#000000',
          },
        },
        paintOverrides: QalaGoMapLightStylePaintMerge.streetLabelPaintOverrides(),
      );
      expect(props, isA<SymbolLayerProperties>());
      final json = props.toJson(skipNulls: true);
      expect(json['text-field'], ['get', 'name']);
      expect(json['text-font'], ['Noto Sans Regular']);
      expect(json['text-color'], '#555D66');
    });

    test('mergeLinePaint preserves width expression shape', () {
      const base = {
        'line-width': [
          'interpolate',
          ['exponential', 1.2],
          ['zoom'],
          14,
          2.5,
          20,
          18,
        ],
      };
      final merged = QalaGoMapLightStylePaintMerge.mergeLinePaint(
        basePaint: base,
        lineColor: '#D4D8DE',
        widthScale: QalaGoMapLightStylePaintMerge.lineWidthScaleMinor,
      );
      expect(merged['line-width'], ['*', base['line-width'], 1.32]);

      final lineProps = qalagoLayerPropertiesWithPaintOverrides(
        layerSnapshot: {
          'type': 'line',
          'layout': {'line-cap': 'round'},
          'paint': merged,
        },
        paintOverrides: const {},
      );
      expect(lineProps, isA<LineLayerProperties>());
      final json = lineProps.toJson(skipNulls: true);
      expect(json['line-cap'], 'round');
      expect(json['line-width'], merged['line-width']);
    });
  });
}
