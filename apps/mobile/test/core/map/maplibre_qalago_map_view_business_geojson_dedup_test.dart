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

  test('userLocation didUpdateWidget does not reference businessGeoJson', () {
    final source = File(
      'lib/core/map/providers/maplibre_qalago_map_view.dart',
    ).readAsStringSync();
    final didUpdate = source.split('void didUpdateWidget')[1].split('@override')[0];
    expect(didUpdate, contains('oldWidget.userLocation != widget.userLocation'));
    expect(didUpdate, isNot(contains('businessGeoJson !=')));
  });
}
