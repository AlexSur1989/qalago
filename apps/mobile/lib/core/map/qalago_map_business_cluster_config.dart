/// Tuning defaults for clustered GeoJSON source (not API contracts).
abstract final class QalaGoMapBusinessClusterConfig {
  /// C.6D: clustered GeoJSON source (recreate source if mode changes).
  static const enabledOnSource = true;

  static const clusterRadius = 55.0;
  static const clusterMaxZoom = 14.0;
  static const clusterMinPoints = 2.0;
}
