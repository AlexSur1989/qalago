import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_light_style_paint_merge.dart';

void main() {
  group('scaleLineWidth', () {
    test('scales numeric constant width', () {
      expect(
        QalaGoMapLightStylePaintMerge.scaleLineWidth(4, 1.32),
        closeTo(5.28, 0.001),
      );
    });

    test('scales interpolate zoom stops without wrapping in multiply', () {
      const expression = [
        'interpolate',
        ['exponential', 1.2],
        ['zoom'],
        13.5,
        0,
        14,
        2.5,
        20,
        18,
      ];
      final scaled = QalaGoMapLightStylePaintMerge.scaleLineWidth(
        expression,
        1.32,
      );
      expect(scaled, isA<List>());
      expect(scaled.first, 'interpolate');
      expect(scaled[2], ['zoom']);
      expect(scaled[3], 13.5);
      expect(scaled[4], 0);
      expect(scaled[5], 14);
      expect(scaled[6], closeTo(3.3, 0.001));
      expect(scaled[7], 20);
      expect(scaled[8], closeTo(23.76, 0.001));
      expect(scaled.contains('*'), isFalse);
    });

    test('scales step zoom outputs at top level', () {
      const expression = [
        'step',
        ['zoom'],
        0.5,
        12,
        1,
        14,
        3,
      ];
      final scaled = QalaGoMapLightStylePaintMerge.scaleLineWidth(
        expression,
        1.26,
      );
      expect(scaled.first, 'step');
      expect(scaled[2], closeTo(0.63, 0.001));
      expect(scaled[4], closeTo(1.26, 0.001));
      expect(scaled[6], closeTo(3.78, 0.001));
    });

    test('returns unsupported expressions unchanged', () {
      const expression = ['*', 2, ['get', 'width']];
      expect(
        QalaGoMapLightStylePaintMerge.scaleLineWidth(expression, 1.32),
        expression,
      );
    });

    test('mergeLinePaint never emits multiply around interpolate', () {
      const base = {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          1,
          16,
          8,
        ],
      };
      final merged = QalaGoMapLightStylePaintMerge.mergeLinePaint(
        basePaint: base,
        lineColor: '#ccc',
        widthScale: QalaGoMapLightStylePaintMerge.lineWidthScalePrimary,
      );
      final width = merged['line-width'] as List;
      expect(width.first, isNot('*'));
      expect(width.first, 'interpolate');
    });
  });
}
