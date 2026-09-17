import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import '../osm_raster_map_config.dart';
import '../qalago_map_bounds.dart';
import '../qalago_map_camera.dart';
import '../qalago_map_controller.dart';
import '../qalago_map_marker.dart';
import 'flutter_map_qalago_map_controller.dart';

/// flutter_map-backed map view (Stage 6.11C.1 fallback).
class FlutterMapQalaGoMapView extends StatefulWidget {
  const FlutterMapQalaGoMapView({
    super.key,
    required this.initialCamera,
    this.controller,
    this.markers = const [],
    this.interactionEnabled = true,
    this.onCameraIdle,
  });

  final QalaGoMapCamera initialCamera;
  final QalaGoMapController? controller;
  final List<QalaGoMapMarker> markers;
  final bool interactionEnabled;
  final QalaGoMapCameraIdleCallback? onCameraIdle;

  @override
  State<FlutterMapQalaGoMapView> createState() => _FlutterMapQalaGoMapViewState();
}

class _FlutterMapQalaGoMapViewState extends State<FlutterMapQalaGoMapView> {
  Future<void> _emitCameraIdle() async {
    final callback = widget.onCameraIdle;
    final controller = widget.controller;
    if (callback == null || controller == null) return;
    final bounds = await controller.readVisibleBounds();
    if (bounds != null) {
      callback(bounds);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mapController = widget.controller is FlutterMapQalaGoMapController
        ? (widget.controller as FlutterMapQalaGoMapController).delegate
        : null;

    return FlutterMap(
      mapController: mapController,
      options: MapOptions(
        initialCenter: qalaGoCoordinateToLatLng(widget.initialCamera.center),
        initialZoom: widget.initialCamera.zoom,
        interactionOptions: InteractionOptions(
          flags: widget.interactionEnabled
              ? InteractiveFlag.all
              : InteractiveFlag.none,
        ),
        onMapEvent: (event) {
          if (event is MapEventMoveEnd) {
            _emitCameraIdle();
          }
        },
        onMapReady: () {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _emitCameraIdle();
          });
        },
      ),
      children: [
        TileLayer(
          urlTemplate: OsmRasterMapConfig.tileUrlTemplate,
          userAgentPackageName: OsmRasterMapConfig.userAgentPackageName,
        ),
        MarkerLayer(
          markers: widget.markers
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
