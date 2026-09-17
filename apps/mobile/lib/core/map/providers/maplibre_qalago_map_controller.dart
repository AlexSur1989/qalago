import 'package:maplibre_gl/maplibre_gl.dart';

import '../qalago_map_controller.dart';
import '../qalago_map_coordinate.dart';

LatLng qalaGoCoordinateToMapLibreLatLng(QalaGoMapCoordinate coordinate) =>
    LatLng(coordinate.latitude, coordinate.longitude);

/// MapLibre camera control; attaches when [MapLibreMap] is created.
class MapLibreQalaGoMapController implements QalaGoMapController {
  MapLibreMapController? _delegate;
  double _zoom = 12;
  QalaGoMapCoordinate? _pendingCenter;
  double? _pendingZoom;

  MapLibreMapController? get delegate => _delegate;

  void attach(MapLibreMapController controller, {required double initialZoom}) {
    _delegate = controller;
    _zoom = controller.cameraPosition?.zoom ?? initialZoom;
    final pendingCenter = _pendingCenter;
    final pendingZoom = _pendingZoom;
    if (pendingCenter != null && pendingZoom != null) {
      _pendingCenter = null;
      _pendingZoom = null;
      move(pendingCenter, pendingZoom);
    }
  }

  void detach() {
    _delegate = null;
  }

  @override
  double get zoom => _delegate?.cameraPosition?.zoom ?? _zoom;

  @override
  void move(QalaGoMapCoordinate center, double zoom) {
    _zoom = zoom;
    final delegate = _delegate;
    if (delegate == null) {
      _pendingCenter = center;
      _pendingZoom = zoom;
      return;
    }
    delegate.moveCamera(
      CameraUpdate.newLatLngZoom(
        qalaGoCoordinateToMapLibreLatLng(center),
        zoom,
      ),
    );
  }

  @override
  void dispose() {
    detach();
  }
}
