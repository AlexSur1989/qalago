import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('camera idle reads bounds and invokes callback before projection finalize', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();

    final idleStart = source.indexOf('Future<void> _onCameraIdle()');
    expect(idleStart, greaterThan(-1));
    final overlayStart = source.indexOf(
      'Future<void> _runOverlayProjectionAfterCameraIdle()',
    );
    expect(overlayStart, greaterThan(idleStart));

    final idleBlock = source.substring(idleStart, overlayStart);
    expect(idleBlock, contains('readVisibleBounds'));
    expect(idleBlock, contains('callback(bounds)'));
    expect(idleBlock, isNot(contains('_finalizeMarkerProjection')));
    expect(idleBlock, contains('_runOverlayProjectionAfterCameraIdle'));
  });

  test('overlay projection finalize still runs after viewport handoff', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    expect(source, contains('MAPDBG projectionFinalize START'));
    expect(source, contains('await _finalizeMarkerProjection()'));
  });
}
