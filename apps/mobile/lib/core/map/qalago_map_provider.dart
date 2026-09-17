import 'qalago_map_controller.dart';
import 'qalago_map_renderer.dart';
import 'providers/flutter_map_qalago_map_controller.dart';
import 'providers/maplibre_qalago_map_controller.dart';

/// Factory for the active map renderer implementation.
QalaGoMapController createQalaGoMapController() {
  switch (resolveQalaGoMapRenderer()) {
    case QalaGoMapRenderer.mapLibre:
      return MapLibreQalaGoMapController();
    case QalaGoMapRenderer.flutterMap:
      return FlutterMapQalaGoMapController();
  }
}
