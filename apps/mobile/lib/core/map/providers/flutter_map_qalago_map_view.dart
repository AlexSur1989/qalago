import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import '../osm_raster_map_config.dart';
import '../qalago_map_camera.dart';
import '../qalago_map_controller.dart';
import '../qalago_map_marker.dart';
import 'flutter_map_qalago_map_controller.dart';

/// flutter_map-backed map view (Stage 6.11C.1 fallback).
class FlutterMapQalaGoMapView extends StatelessWidget {
  const FlutterMapQalaGoMapView({
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
    final mapController = controller is FlutterMapQalaGoMapController
        ? (controller as FlutterMapQalaGoMapController).delegate
        : null;

    return FlutterMap(
      mapController: mapController,
      options: MapOptions(
        initialCenter: qalaGoCoordinateToLatLng(initialCamera.center),
        initialZoom: initialCamera.zoom,
        interactionOptions: InteractionOptions(
          flags: interactionEnabled ? InteractiveFlag.all : InteractiveFlag.none,
        ),
      ),
      children: [
        TileLayer(
          urlTemplate: OsmRasterMapConfig.tileUrlTemplate,
          userAgentPackageName: OsmRasterMapConfig.userAgentPackageName,
        ),
        MarkerLayer(
          markers: markers
              .map(
                (marker) => Marker(
                  point: qalaGoCoordinateToLatLng(marker.position),
                  width: marker.width,
                  height: marker.height,
                  child: marker.child,
                ),
              )
              .toList(),
        ),
        RichAttributionWidget(
          alignment: AttributionAlignment.bottomLeft,
          attributions: const [
            TextSourceAttribution(OsmRasterMapConfig.attributionLabel),
          ],
        ),
      ],
    );
  }
}
