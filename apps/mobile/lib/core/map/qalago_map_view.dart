import 'package:flutter/widgets.dart';

import 'providers/flutter_map_qalago_map_view.dart';
import 'providers/maplibre_qalago_map_view.dart';
import 'qalago_map_bounds.dart';
import 'qalago_map_camera.dart';
import 'qalago_map_controller.dart';
import 'qalago_map_marker.dart';
import 'qalago_map_renderer.dart';

export 'qalago_map_bounds.dart' show QalaGoMapBounds, QalaGoMapCameraIdleCallback;

export 'providers/flutter_map_qalago_map_view.dart' show FlutterMapQalaGoMapView;
export 'providers/maplibre_qalago_map_view.dart' show MapLibreQalaGoMapView;

/// Renderer-neutral map widget — delegates to MapLibre or flutter_map adapter.
class QalaGoMapView extends StatelessWidget {
  const QalaGoMapView({
    super.key,
    required this.initialCamera,
    this.controller,
    this.markers = const [],
    this.businessGeoJson,
    this.interactionEnabled = true,
    this.onCameraIdle,
  });

  final QalaGoMapCamera initialCamera;
  final QalaGoMapController? controller;
  final List<QalaGoMapMarker> markers;

  /// Experimental native layer payload (MapLibre only); ignored when flag is off.
  final Map<String, dynamic>? businessGeoJson;

  final bool interactionEnabled;
  final QalaGoMapCameraIdleCallback? onCameraIdle;

  @override
  Widget build(BuildContext context) {
    switch (resolveQalaGoMapRenderer()) {
      case QalaGoMapRenderer.mapLibre:
        return MapLibreQalaGoMapView(
          key: key,
          initialCamera: initialCamera,
          controller: controller,
          markers: markers,
          businessGeoJson: businessGeoJson,
          interactionEnabled: interactionEnabled,
          onCameraIdle: onCameraIdle,
        );
      case QalaGoMapRenderer.flutterMap:
        return FlutterMapQalaGoMapView(
          key: key,
          initialCamera: initialCamera,
          controller: controller,
          markers: markers,
          interactionEnabled: interactionEnabled,
          onCameraIdle: onCameraIdle,
        );
    }
  }
}
