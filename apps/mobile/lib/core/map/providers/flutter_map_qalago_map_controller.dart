import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../qalago_map_controller.dart';
import '../qalago_map_coordinate.dart';

LatLng qalaGoCoordinateToLatLng(QalaGoMapCoordinate coordinate) =>
    LatLng(coordinate.latitude, coordinate.longitude);

QalaGoMapCoordinate latLngToQalaGoCoordinate(LatLng point) =>
    QalaGoMapCoordinate(latitude: point.latitude, longitude: point.longitude);

class FlutterMapQalaGoMapController implements QalaGoMapController {
  FlutterMapQalaGoMapController() : _delegate = MapController();

  final MapController _delegate;

  MapController get delegate => _delegate;

  @override
  double get zoom => _delegate.camera.zoom;

  @override
  void move(QalaGoMapCoordinate center, double zoom) {
    _delegate.move(qalaGoCoordinateToLatLng(center), zoom);
  }

  @override
  void dispose() {
    _delegate.dispose();
  }
}
