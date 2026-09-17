import 'qalago_map_bounds.dart';
import 'qalago_map_coordinate.dart';

/// Renderer-neutral map camera control.
abstract class QalaGoMapController {
  double get zoom;

  void move(QalaGoMapCoordinate center, double zoom);

  /// Current visible viewport, if the renderer is ready.
  Future<QalaGoMapBounds?> readVisibleBounds();

  void dispose();
}
