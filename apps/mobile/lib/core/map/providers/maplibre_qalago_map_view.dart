import 'dart:async';

import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../qalago_map_camera.dart';
import '../qalago_map_controller.dart';
import '../qalago_map_marker.dart';
import '../qalago_map_renderer.dart';
import '../qalago_map_bounds.dart';
import '../qalago_map_style_config.dart';
import '../widgets/qalago_map_attribution_bar.dart';
import '../qalago_native_map_business_layer_config.dart';
import 'maplibre_overlay_projection_sync.dart';
import 'maplibre_qalago_map_controller.dart';
import 'qalago_map_business_layer_controller.dart';

/// MapLibre-backed [QalaGoMapView] implementation (Stage 6.11C.2).
class MapLibreQalaGoMapView extends StatefulWidget {
  const MapLibreQalaGoMapView({
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
  final Map<String, dynamic>? businessGeoJson;
  final bool interactionEnabled;
  final QalaGoMapCameraIdleCallback? onCameraIdle;

  @override
  State<MapLibreQalaGoMapView> createState() => _MapLibreQalaGoMapViewState();
}

class _MapLibreQalaGoMapViewState extends State<MapLibreQalaGoMapView> {
  MapLibreMapController? _nativeController;
  Map<int, Offset> _markerOffsets = const {};
  final MapLibreOverlayProjectionSync _projectionSync =
      MapLibreOverlayProjectionSync();
  final QalaGoMapBusinessLayerController _businessLayerController =
      QalaGoMapBusinessLayerController();

  MapLibreQalaGoMapController? get _qalagoController =>
      widget.controller is MapLibreQalaGoMapController
          ? widget.controller as MapLibreQalaGoMapController
          : null;

  @override
  void dispose() {
    _businessLayerController.dispose();
    _projectionSync.dispose();
    super.dispose();
  }

  Future<void> _syncNativeBusinessLayer() async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    final native = _nativeController;
    if (native == null || !mounted) {
      return;
    }
    final geoJson =
        widget.businessGeoJson ?? QalaGoMapBusinessLayerController.emptyFeatureCollection();
    await _businessLayerController.syncBusinessGeoJson(native, geoJson);
  }

  Future<void> _onStyleLoaded() async {
    if (!mounted) {
      return;
    }
    final native = _nativeController;
    if (native != null &&
        QalaGoNativeMapBusinessLayerConfig.enabled) {
      await _businessLayerController.onStyleLoaded(native);
      await _syncNativeBusinessLayer();
    }
    await _onCameraIdle();
  }

  void _onCameraMove(CameraPosition position) {
    _projectionSync.bumpGeneration();
    _projectionSync.scheduleFrame(() {
      if (!mounted) return;
      unawaited(_runMarkerProjection());
    });
  }

  Future<void> _runMarkerProjection({bool waitForTurn = false}) async {
    while (mounted) {
      if (!_projectionSync.beginProjection()) {
        if (!waitForTurn) return;
        await Future<void>.delayed(Duration.zero);
        continue;
      }
      final generation = _projectionSync.generation;
      try {
        await _projectMarkersForGeneration(generation);
      } finally {
        _projectionSync.endProjection(() {
          if (mounted) unawaited(_runMarkerProjection());
        });
      }
      return;
    }
  }

  Future<void> _finalizeMarkerProjection() async {
    await _runMarkerProjection(waitForTurn: true);
    while (mounted &&
        (_projectionSync.isProjectionInFlight ||
            _projectionSync.hasPendingRerun)) {
      await _runMarkerProjection(waitForTurn: true);
    }
  }

  Future<void> _projectMarkersForGeneration(int generation) async {
    final native = _nativeController;
    if (!mounted || _projectionSync.isStale(generation)) return;

    if (native == null || widget.markers.isEmpty) {
      if (_markerOffsets.isNotEmpty && mounted && !_projectionSync.isStale(generation)) {
        setState(() => _markerOffsets = const {});
      }
      return;
    }

    final latLngs = widget.markers
        .map((m) => qalaGoCoordinateToMapLibreLatLng(m.position))
        .toList();
    try {
      final points = await native.toScreenLocationBatch(latLngs);
      if (!mounted || _projectionSync.isStale(generation)) return;
      final next = <int, Offset>{};
      for (var i = 0; i < widget.markers.length; i++) {
        final point = points[i];
        final marker = widget.markers[i];
        next[i] = Offset(
          point.x.toDouble() - marker.width / 2,
          point.y.toDouble() - marker.height,
        );
      }
      setState(() => _markerOffsets = next);
    } catch (_) {
      // Map not ready or coords off-screen — skip frame.
    }
  }

  Future<void> _onCameraIdle() async {
    _projectionSync.bumpGeneration();
    await _finalizeMarkerProjection();
    final callback = widget.onCameraIdle;
    final qController = widget.controller;
    if (callback == null || qController == null) return;
    final bounds = await qController.readVisibleBounds();
    if (bounds != null && mounted) {
      callback(bounds);
    }
  }

  void _onMapCreated(MapLibreMapController controller) {
    _nativeController = controller;
    _qalagoController?.attach(
      controller,
      initialZoom: widget.initialCamera.zoom,
    );
    unawaited(_onCameraIdle());
  }

  @override
  void didUpdateWidget(covariant MapLibreQalaGoMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.markers != widget.markers) {
      _projectionSync.bumpGeneration();
      unawaited(_runMarkerProjection());
    }
    if (oldWidget.businessGeoJson != widget.businessGeoJson) {
      unawaited(_syncNativeBusinessLayer());
    }
  }

  @override
  Widget build(BuildContext context) {
    final gestures = widget.interactionEnabled;
    return Stack(
      children: [
        MapLibreMap(
          styleString: QalaGoMapStyleConfig.styleUrl,
          trackCameraPosition: true,
          initialCameraPosition: CameraPosition(
            target: qalaGoCoordinateToMapLibreLatLng(widget.initialCamera.center),
            zoom: widget.initialCamera.zoom,
          ),
          // Pitch/rotation break screen-projected Flutter marker overlays (C.3).
          rotateGesturesEnabled: false,
          scrollGesturesEnabled: gestures,
          zoomGesturesEnabled: gestures,
          tiltGesturesEnabled: false,
          myLocationEnabled: false,
          onMapCreated: _onMapCreated,
          onStyleLoadedCallback: () {
            unawaited(_onStyleLoaded());
          },
          onCameraMove: _onCameraMove,
          onCameraIdle: _onCameraIdle,
        ),
        ...widget.markers.asMap().entries.map((entry) {
          final index = entry.key;
          final marker = entry.value;
          final offset = _markerOffsets[index];
          if (offset == null) return const SizedBox.shrink();
          return Positioned(
            left: offset.dx,
            top: offset.dy,
            width: marker.width,
            height: marker.height,
            child: IgnorePointer(
              ignoring: !gestures,
              child: marker.child,
            ),
          );
        }),
        const Positioned(
          left: 4,
          bottom: 4,
          child: QalaGoMapAttributionBar(renderer: QalaGoMapRenderer.mapLibre),
        ),
      ],
    );
  }
}
