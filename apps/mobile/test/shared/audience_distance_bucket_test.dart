import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

void main() {
  group('distanceKmToAudienceBucket', () {
    test('maps boundary values correctly', () {
      expect(distanceKmToAudienceBucket(0), AudienceDistanceBucket.lt1Km);
      expect(distanceKmToAudienceBucket(0.999), AudienceDistanceBucket.lt1Km);
      expect(distanceKmToAudienceBucket(1.0), AudienceDistanceBucket.km1_3);
      expect(distanceKmToAudienceBucket(2.999), AudienceDistanceBucket.km1_3);
      expect(distanceKmToAudienceBucket(3.0), AudienceDistanceBucket.km3_5);
      expect(distanceKmToAudienceBucket(4.999), AudienceDistanceBucket.km3_5);
      expect(distanceKmToAudienceBucket(5.0), AudienceDistanceBucket.km5_10);
      expect(distanceKmToAudienceBucket(9.999), AudienceDistanceBucket.km5_10);
      expect(distanceKmToAudienceBucket(10.0), AudienceDistanceBucket.gt10Km);
      expect(distanceKmToAudienceBucket(100), AudienceDistanceBucket.gt10Km);
    });

    test('returns UNKNOWN for invalid input', () {
      expect(distanceKmToAudienceBucket(null), AudienceDistanceBucket.unknown);
      expect(distanceKmToAudienceBucket(double.nan), AudienceDistanceBucket.unknown);
      expect(distanceKmToAudienceBucket(-1), AudienceDistanceBucket.unknown);
    });
  });

  group('computeAudienceDistanceBucket', () {
    const businessLat = 51.23;
    const businessLng = 51.38;
    const userNear = UserPosition(latitude: 51.231, longitude: 51.381);

    test('valid position and business coords produce bucket', () {
      final bucket = computeAudienceDistanceBucket(
        businessLat: businessLat,
        businessLng: businessLng,
        userPosition: userNear,
      );
      expect(bucket, isNot(AudienceDistanceBucket.unknown));
    });

    test('no user position returns UNKNOWN', () {
      expect(
        computeAudienceDistanceBucket(
          businessLat: businessLat,
          businessLng: businessLng,
          userPosition: null,
        ),
        AudienceDistanceBucket.unknown,
      );
    });

    test('business without coordinates returns UNKNOWN', () {
      expect(
        computeAudienceDistanceBucket(
          businessLat: null,
          businessLng: null,
          userPosition: userNear,
        ),
        AudienceDistanceBucket.unknown,
      );
    });
  });

  group('audienceDistanceBucketLabel', () {
    test('Russian labels', () {
      expect(audienceDistanceBucketLabel(AudienceDistanceBucket.lt1Km), 'До 1 км');
      expect(audienceDistanceBucketLabel(AudienceDistanceBucket.km1_3), '1–3 км');
      expect(audienceDistanceBucketLabel(AudienceDistanceBucket.unknown), 'Не определено');
    });
  });
}
