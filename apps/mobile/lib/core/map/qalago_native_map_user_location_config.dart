import 'qalago_map_renderer.dart';

/// MapLibre native user-location CircleLayer (MAP-LOCATION.1).
///
/// flutter_map continues to use Flutter overlay markers for user location.
abstract final class QalaGoNativeMapUserLocationConfig {
  static bool enabledForRenderer(QalaGoMapRenderer renderer) =>
      renderer == QalaGoMapRenderer.mapLibre;
}
