import 'package:flutter/widgets.dart';

import 'providers/flutter_map_qalago_map_view.dart';
import 'providers/maplibre_qalago_map_view.dart';
import 'qalago_map_camera.dart';
import 'qalago_map_controller.dart';
import 'qalago_map_marker.dart';
import 'qalago_map_renderer.dart';

export 'providers/flutter_map_qalago_map_view.dart' show FlutterMapQalaGoMapView;
export 'providers/maplibre_qalago_map_view.dart' show MapLibreQalaGoMapView;

/// Renderer-neutral map widget — delegates to MapLibre or flutter_map adapter.
class QalaGoMapView extends StatelessWidget {
  const QalaGoMapView({
    super.key,
    required this.initialCamera,
    this.controller,
    this.markers = const [],
    this.interactionEnabled = true,
  });

  final QalaGoMapCamera initialCamera;
  final QalaGoMapController? controller;
  final List<QalaGoMapMarker> markers;
  final bool interactionEnabled;

  @override
  Widget build(BuildContext context) {
    switch (resolveQalaGoMapRenderer()) {
      case QalaGoMapRenderer.mapLibre:
        return MapLibreQalaGoMapView(
          key: key,
          initialCamera: initialCamera,
          controller: controller,
          markers: markers,
          interactionEnabled: interactionEnabled,
        );
      case QalaGoMapRenderer.flutterMap:
        return FlutterMapQalaGoMapView(
          key: key,
          initialCamera: initialCamera,
          controller: controller,
          markers: markers,
          interactionEnabled: interactionEnabled,
        );
    }
  }
}
