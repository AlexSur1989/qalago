import 'qalago_map_coordinate.dart';

typedef QalaGoMapCameraIdleCallback = void Function(QalaGoMapBounds bounds);

/// Visible map viewport in WGS84 (Stage 6.11C.3).
class QalaGoMapBounds {
  const QalaGoMapBounds({
    required this.southwest,
    required this.northeast,
  });

  final QalaGoMapCoordinate southwest;
  final QalaGoMapCoordinate northeast;

  double get minLat => southwest.latitude <= northeast.latitude
      ? southwest.latitude
      : northeast.latitude;
  double get maxLat => southwest.latitude >= northeast.latitude
      ? southwest.latitude
      : northeast.latitude;
  double get minLng => southwest.longitude <= northeast.longitude
      ? southwest.longitude
      : northeast.longitude;
  double get maxLng => southwest.longitude >= northeast.longitude
      ? southwest.longitude
      : northeast.longitude;

  /// Expands bounds by [paddingRatio] (e.g. 0.12 = 12%) for fetch hysteresis.
  QalaGoMapBounds padded(double paddingRatio) {
    final latSpan = (maxLat - minLat).abs();
    final lngSpan = (maxLng - minLng).abs();
    final latPad = latSpan * paddingRatio;
    final lngPad = lngSpan * paddingRatio;
    return QalaGoMapBounds(
      southwest: QalaGoMapCoordinate(
        latitude: (minLat - latPad).clamp(-90.0, 90.0),
        longitude: (minLng - lngPad).clamp(-180.0, 180.0),
      ),
      northeast: QalaGoMapCoordinate(
        latitude: (maxLat + latPad).clamp(-90.0, 90.0),
        longitude: (maxLng + lngPad).clamp(-180.0, 180.0),
      ),
    );
  }

  bool contains(QalaGoMapCoordinate coordinate) {
    return coordinate.latitude >= minLat &&
        coordinate.latitude <= maxLat &&
        coordinate.longitude >= minLng &&
        coordinate.longitude <= maxLng;
  }

  @override
  bool operator ==(Object other) =>
      other is QalaGoMapBounds &&
      other.southwest == southwest &&
      other.northeast == northeast;

  @override
  int get hashCode => Object.hash(southwest, northeast);
}
