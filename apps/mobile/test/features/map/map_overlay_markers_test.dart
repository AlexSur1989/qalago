import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_marker.dart';
import 'package:qalago_mobile/core/map/qalago_map_renderer.dart';
import 'package:qalago_mobile/features/map/map_overlay_markers.dart';

void main() {
  test('native flag off keeps all overlay markers', () {
    final markers = [
      QalaGoMapMarker(
        id: kUserLocationMarkerId,
        position: const QalaGoMapCoordinate(latitude: 1, longitude: 2),
        width: 1,
        height: 1,
        child: const SizedBox.shrink(),
      ),
      QalaGoMapMarker(
        id: 'biz',
        position: const QalaGoMapCoordinate(latitude: 1, longitude: 2),
        width: 1,
        height: 1,
        child: const SizedBox.shrink(),
      ),
    ];
    expect(
      resolveMapOverlayMarkers(
        markers: markers,
        renderer: QalaGoMapRenderer.flutterMap,
      ).length,
      2,
    );
  });
}
