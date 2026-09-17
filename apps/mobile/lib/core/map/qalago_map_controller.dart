import 'qalago_map_coordinate.dart';

/// Renderer-neutral map camera control.
abstract class QalaGoMapController {
  double get zoom;

  void move(QalaGoMapCoordinate center, double zoom);

  void dispose();
}
