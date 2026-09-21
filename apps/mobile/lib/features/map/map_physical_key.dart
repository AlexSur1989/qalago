import '../../shared/models/models.dart';

/// Physical map marker identity (Stage 6.12A.7.2).
///
/// [BusinessModel.id] remains the parent Business; [locationId] is the branch row.
String mapPhysicalKey(BusinessModel business) {
  final locationId = business.locationId;
  if (locationId != null && locationId.isNotEmpty) {
    return locationId;
  }
  return business.id;
}
