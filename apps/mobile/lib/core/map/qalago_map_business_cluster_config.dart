/// Tuning defaults for clustered GeoJSON source (not API contracts).
abstract final class QalaGoMapBusinessClusterConfig {
  /// C.6C: false (unclustered visible points). C.6D: set true and recreate source.
  static const enabledOnSource = false;

  static const clusterRadius = 55.0;
  static const clusterMaxZoom = 14.0;
  static const clusterMinPoints = 2.0;
}
