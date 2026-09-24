import '../../core/map/qalago_map_bounds.dart';

/// Conservative epsilon for WGS84 bbox edge comparisons (~1 cm latitude).
const kMapBoundsCoverageEpsilon = 1e-7;

/// True when [visible] is fully inside [fetched] padded coverage (spatial hysteresis).
bool mapBoundsVisibleWithinFetchedCoverage({
  required QalaGoMapBounds fetched,
  required QalaGoMapBounds visible,
  double epsilon = kMapBoundsCoverageEpsilon,
}) {
  return fetched.minLat <= visible.minLat + epsilon &&
      fetched.maxLat >= visible.maxLat - epsilon &&
      fetched.minLng <= visible.minLng + epsilon &&
      fetched.maxLng >= visible.maxLng - epsilon;
}

/// True when no new viewport fetch is needed (visible still inside last fetch coverage).
bool mapViewportFetchSuppressed({
  required QalaGoMapBounds? fetchedCoverage,
  required QalaGoMapBounds visible,
  double epsilon = kMapBoundsCoverageEpsilon,
}) {
  if (fetchedCoverage == null) return false;
  return mapBoundsVisibleWithinFetchedCoverage(
    fetched: fetchedCoverage,
    visible: visible,
    epsilon: epsilon,
  );
}
