import 'package:geolocator/geolocator.dart';

import '../../core/location/user_location_provider.dart';

enum AudienceDistanceBucket {
  lt1Km('LT_1_KM'),
  km1_3('KM_1_3'),
  km3_5('KM_3_5'),
  km5_10('KM_5_10'),
  gt10Km('GT_10_KM'),
  unknown('UNKNOWN');

  const AudienceDistanceBucket(this.apiValue);

  final String apiValue;
}

/// Coarse distance bucket from km. Boundaries match backend Stage 5J.
AudienceDistanceBucket distanceKmToAudienceBucket(double? distanceKm) {
  if (distanceKm == null || !distanceKm.isFinite || distanceKm < 0) {
    return AudienceDistanceBucket.unknown;
  }
  if (distanceKm < 1) return AudienceDistanceBucket.lt1Km;
  if (distanceKm < 3) return AudienceDistanceBucket.km1_3;
  if (distanceKm < 5) return AudienceDistanceBucket.km3_5;
  if (distanceKm < 10) return AudienceDistanceBucket.km5_10;
  return AudienceDistanceBucket.gt10Km;
}

String audienceDistanceBucketLabel(AudienceDistanceBucket bucket) {
  switch (bucket) {
    case AudienceDistanceBucket.lt1Km:
      return 'До 1 км';
    case AudienceDistanceBucket.km1_3:
      return '1–3 км';
    case AudienceDistanceBucket.km3_5:
      return '3–5 км';
    case AudienceDistanceBucket.km5_10:
      return '5–10 км';
    case AudienceDistanceBucket.gt10Km:
      return 'Более 10 км';
    case AudienceDistanceBucket.unknown:
      return 'Не определено';
  }
}

AudienceDistanceBucket computeAudienceDistanceBucket({
  required double? businessLat,
  required double? businessLng,
  UserPosition? userPosition,
}) {
  if (businessLat == null ||
      businessLng == null ||
      userPosition == null) {
    return AudienceDistanceBucket.unknown;
  }

  final meters = Geolocator.distanceBetween(
    userPosition.latitude,
    userPosition.longitude,
    businessLat,
    businessLng,
  );
  return distanceKmToAudienceBucket(meters / 1000);
}
