import '../../core/map/qalago_map_marker.dart';
import '../../core/map/qalago_map_renderer.dart';
import '../../core/map/qalago_native_map_business_layer_config.dart';

const kUserLocationMarkerId = '__user_location__';

/// Overlay markers for the active renderer (C.6C: hide business pins when native layer is on).
List<QalaGoMapMarker> resolveMapOverlayMarkers({
  required List<QalaGoMapMarker> markers,
  required QalaGoMapRenderer renderer,
}) {
  final nativeBusinessLayer = renderer == QalaGoMapRenderer.mapLibre &&
      QalaGoNativeMapBusinessLayerConfig.enabled;
  if (!nativeBusinessLayer) {
    return markers;
  }
  return markers
      .where((marker) => marker.id == kUserLocationMarkerId)
      .toList(growable: false);
}
