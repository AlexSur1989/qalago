import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// MAP-PERF.C3.2: widget rebuild contract (fingerprint, not Map reference).
void main() {
  test('MapLibreQalaGoMapView syncs business GeoJSON on fingerprint change only', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    expect(source, contains('businessGeoJsonFingerprint'));
    expect(
      source,
      contains(
        'oldWidget.businessGeoJsonFingerprint != widget.businessGeoJsonFingerprint',
      ),
    );
    expect(source, isNot(contains('oldWidget.businessGeoJson != widget.businessGeoJson')));
  });

  test('camera idle/move paths do not sync native business GeoJSON', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    final cameraIdle = source.split('Future<void> _onCameraIdle()')[1].split('Future<void> _runOverlayProjectionAfterCameraIdle')[0];
    expect(cameraIdle, isNot(contains('_syncNativeBusinessLayer')));
    final cameraMove = source.split('void _onCameraMove(')[1].split('Future<void> _runMarkerProjection')[0];
    expect(cameraMove, isNot(contains('_syncNativeBusinessLayer')));
  });

  test('userLocation didUpdateWidget does not reference businessGeoJson', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    final didUpdate = source.split('void didUpdateWidget')[1].split('@override')[0];
    expect(didUpdate, contains('oldWidget.userLocation != widget.userLocation'));
    expect(didUpdate, isNot(contains('businessGeoJson !=')));
  });
}
