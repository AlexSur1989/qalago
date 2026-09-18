import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('MapLibreQalaGoMapView wires camera move tracking for overlay sync', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    expect(source, contains('trackCameraPosition: true'));
    expect(source, contains('onCameraMove: _onCameraMove'));
    expect(source, isNot(contains('onCameraMove: null')));
  });

  test('camera idle still invokes onCameraIdle callback after projection', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    expect(source, contains('Future<void> _onCameraIdle()'));
    expect(source, contains('callback(bounds)'));
  });
}
