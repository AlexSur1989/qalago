/// SDK-neutral WGS84 map coordinate (Stage 6.11C.1).
class QalaGoMapCoordinate {
  const QalaGoMapCoordinate({
    required this.latitude,
    required this.longitude,
  });

  final double latitude;
  final double longitude;

  @override
  bool operator ==(Object other) =>
      other is QalaGoMapCoordinate &&
      other.latitude == latitude &&
      other.longitude == longitude;

  @override
  int get hashCode => Object.hash(latitude, longitude);
}
