import 'qalago_map_coordinate.dart';

/// Renderer-neutral map camera position.
class QalaGoMapCamera {
  const QalaGoMapCamera({
    required this.center,
    required this.zoom,
  });

  final QalaGoMapCoordinate center;
  final double zoom;
}
