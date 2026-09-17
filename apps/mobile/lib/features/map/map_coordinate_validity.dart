import '../../shared/models/models.dart';

bool isValidMapCoordinate(double? latitude, double? longitude) {
  if (latitude == null || longitude == null) return false;
  if (!latitude.isFinite || !longitude.isFinite) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude == 0 && longitude == 0) return false;
  return true;
}

List<BusinessModel> businessesWithValidMapCoordinates(List<BusinessModel> items) {
  return items
      .where(
        (b) => isValidMapCoordinate(b.latitude, b.longitude),
      )
      .toList();
}
