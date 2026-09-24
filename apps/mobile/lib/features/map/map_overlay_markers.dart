import 'package:flutter/foundation.dart';

import '../../core/map/qalago_map_marker.dart';
import '../../core/map/qalago_map_renderer.dart';
import '../../core/map/qalago_native_map_business_layer_config.dart';
import '../../core/map/qalago_native_map_user_location_config.dart';

const kUserLocationMarkerId = '__user_location__';

/// Overlay markers for the active renderer (native MapLibre layers vs Flutter projection).
List<QalaGoMapMarker> resolveMapOverlayMarkers({
  required List<QalaGoMapMarker> markers,
  required QalaGoMapRenderer renderer,
}) {
  return filterMapOverlayMarkers(
    markers: markers,
    nativeBusinessLayer: renderer == QalaGoMapRenderer.mapLibre &&
        QalaGoNativeMapBusinessLayerConfig.enabled,
    nativeUserLocationLayer:
        QalaGoNativeMapUserLocationConfig.enabledForRenderer(renderer),
  );
}

@visibleForTesting
List<QalaGoMapMarker> filterMapOverlayMarkers({
  required List<QalaGoMapMarker> markers,
  required bool nativeBusinessLayer,
  required bool nativeUserLocationLayer,
}) {
  if (!nativeBusinessLayer && !nativeUserLocationLayer) {
    return markers;
  }
  return markers
      .where((marker) {
        if (nativeBusinessLayer && marker.id != kUserLocationMarkerId) {
          return false;
        }
        if (nativeUserLocationLayer && marker.id == kUserLocationMarkerId) {
          return false;
        }
        return true;
      })
      .toList(growable: false);
}
