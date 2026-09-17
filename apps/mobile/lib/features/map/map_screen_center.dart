import '../../core/location/user_location_provider.dart';
import '../../core/map/qalago_map_coordinate.dart';
import '../../core/providers/city_provider.dart';
import '../../shared/models/models.dart';
import '../../shared/utils/consumer_discovery_utils.dart';

/// MapScreen initial camera center (preserves Stage 5D / 6.11C.0 behavior).
QalaGoMapCoordinate resolveMapScreenCenter({
  required CityState city,
  required UserPosition? userPosition,
  required List<BusinessModel> businesses,
}) {
  final center = mapInitialCenter(
    cityCenterLat: city.centerLat,
    cityCenterLng: city.centerLng,
    userLat: userPosition?.latitude,
    userLng: userPosition?.longitude,
  );
  if (center.lat == city.centerLat && center.lng == city.centerLng) {
    return QalaGoMapCoordinate(latitude: center.lat, longitude: center.lng);
  }
  if (userPosition != null &&
      center.lat == userPosition.latitude &&
      center.lng == userPosition.longitude) {
    return QalaGoMapCoordinate(latitude: center.lat, longitude: center.lng);
  }
  final withCoords = businessesWithCoordinates(businesses);
  if (withCoords.isNotEmpty &&
      city.centerLat == null &&
      city.centerLng == null) {
    return QalaGoMapCoordinate(
      latitude: withCoords.first.latitude!,
      longitude: withCoords.first.longitude!,
    );
  }
  return QalaGoMapCoordinate(latitude: center.lat, longitude: center.lng);
}
