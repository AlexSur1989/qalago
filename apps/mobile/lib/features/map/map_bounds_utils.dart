import '../../core/map/qalago_map_bounds.dart';

/// Returns true when a refetch is warranted (viewport moved or zoom changed).
bool mapBoundsFetchNeeded({
  required QalaGoMapBounds? previous,
  required QalaGoMapBounds next,
  double minLatDelta = 0.002,
  double minLngDelta = 0.002,
}) {
  if (previous == null) return true;
  final latShift = (previous.minLat - next.minLat).abs() +
      (previous.maxLat - next.maxLat).abs();
  final lngShift = (previous.minLng - next.minLng).abs() +
      (previous.maxLng - next.maxLng).abs();
  return latShift > minLatDelta || lngShift > minLngDelta;
}
