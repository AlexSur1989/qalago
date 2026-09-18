import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_style_config.dart';
void main() {
  group('QalaGoMapStyleConfig', () {
    test('defaultDevelopmentStyleUrl is OpenFreeMap Liberty', () {
      expect(
        QalaGoMapStyleConfig.defaultDevelopmentStyleUrl,
        'https://tiles.openfreemap.org/styles/liberty',
      );
    });

    test('styleUrl uses default when QALAGO_MAP_STYLE_URL unset', () {
      const fromEnv = String.fromEnvironment('QALAGO_MAP_STYLE_URL');
      if (fromEnv.isNotEmpty) {
        expect(QalaGoMapStyleConfig.styleUrl, fromEnv);
      } else {
        expect(
          QalaGoMapStyleConfig.styleUrl,
          QalaGoMapStyleConfig.defaultDevelopmentStyleUrl,
        );
      }
    });

    test('styleUrl matches compile-time QALAGO_MAP_STYLE_URL when set', () {
      const override = String.fromEnvironment('QALAGO_MAP_STYLE_URL');
      if (override.isEmpty) return;
      expect(QalaGoMapStyleConfig.styleUrl, override);
    });
  });
}
