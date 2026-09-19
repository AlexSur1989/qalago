import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MapLibre style lifecycle (C.6F.2)', () {
    test('onStyleLoaded order: hardening → light → house numbers → business', () {
      final source = File(
        'lib/core/map/providers/maplibre_qalago_map_view.dart',
      ).readAsStringSync();
      final hardening = source.indexOf('_basemapHardening.apply');
      final light = source.indexOf('_lightStyle.apply');
      final house = source.indexOf('_houseNumbers.apply');
      final business = source.indexOf('_businessLayerController.onStyleLoaded');
      expect(hardening, greaterThan(0));
      expect(light, greaterThan(hardening));
      expect(house, greaterThan(light));
      expect(business, greaterThan(house));
    });

    test('style mutations are not triggered from camera handlers', () {
      final source = File(
        'lib/core/map/providers/maplibre_qalago_map_view.dart',
      ).readAsStringSync();
      expect(source.contains('_onCameraMove'), isTrue);
      final styleLoaded = source.substring(
        source.indexOf('Future<void> _onStyleLoaded'),
        source.indexOf('void _onCameraMove'),
      );
      expect(styleLoaded.contains('_lightStyle.apply'), isTrue);
      expect(styleLoaded.contains('_houseNumbers.apply'), isTrue);
      final cameraSection = source.substring(
        source.indexOf('void _onCameraMove'),
        source.indexOf('Future<void> _runMarkerProjection'),
      );
      expect(cameraSection.contains('.apply(native)'), isFalse);
      expect(cameraSection.contains('beginStyleLoad'), isFalse);
    });
  });
}
