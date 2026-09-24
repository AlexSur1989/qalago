import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_marker.dart';
import 'package:qalago_mobile/core/map/qalago_map_renderer.dart';
import 'package:qalago_mobile/features/map/map_overlay_markers.dart';

QalaGoMapMarker _marker(String id) => QalaGoMapMarker(
      id: id,
      position: const QalaGoMapCoordinate(latitude: 1, longitude: 2),
      width: 1,
      height: 1,
      child: const SizedBox.shrink(),
    );

void main() {
  test('flutter_map keeps all overlay markers including user', () {
    final markers = [_marker(kUserLocationMarkerId), _marker('biz')];
    expect(
      resolveMapOverlayMarkers(
        markers: markers,
        renderer: QalaGoMapRenderer.flutterMap,
      ).length,
      2,
    );
  });

  test('MapLibre native user layer excludes user from overlay projection', () {
    final markers = [_marker(kUserLocationMarkerId), _marker('biz')];
    final resolved = resolveMapOverlayMarkers(
      markers: markers,
      renderer: QalaGoMapRenderer.mapLibre,
    );
    expect(resolved.where((m) => m.id == kUserLocationMarkerId), isEmpty);
    expect(resolved.where((m) => m.id == 'biz'), hasLength(1));
  });

  test('physical APK config: native business + native user yields empty overlay',
      () {
    final markers = [_marker(kUserLocationMarkerId), _marker('biz')];
    expect(
      filterMapOverlayMarkers(
        markers: markers,
        nativeBusinessLayer: true,
        nativeUserLocationLayer: true,
      ),
      isEmpty,
    );
  });

  test('native business-only overlay keeps user marker for projection', () {
    final markers = [_marker(kUserLocationMarkerId), _marker('biz')];
    final resolved = filterMapOverlayMarkers(
      markers: markers,
      nativeBusinessLayer: true,
      nativeUserLocationLayer: false,
    );
    expect(resolved.map((m) => m.id).toList(), [kUserLocationMarkerId]);
  });
}
