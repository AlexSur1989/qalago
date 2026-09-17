import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/location/business_location_value.dart';

void main() {
  group('BusinessLocationValue', () {
    test('hasValidCoordinates rejects null and 0,0', () {
      expect(const BusinessLocationValue().hasValidCoordinates, isFalse);
      expect(
        const BusinessLocationValue(latitude: 0, longitude: 0).hasValidCoordinates,
        isFalse,
      );
      expect(
        const BusinessLocationValue(latitude: 51.2, longitude: 51.4).hasValidCoordinates,
        isTrue,
      );
    });

    test('toPayload includes locationSource', () {
      final payload = const BusinessLocationValue(
        displayAddress: 'Street 1',
        latitude: 51.2,
        longitude: 51.4,
        source: BusinessLocationSource.manuallyAdjusted,
      ).toPayload();
      expect(payload['locationSource'], 'MANUALLY_ADJUSTED');
    });

    test('fromApplicationJson parses decimals', () {
      final value = BusinessLocationValue.fromApplicationJson({
        'address': 'Addr',
        'latitude': '51.23',
        'longitude': '51.37',
        'locationSource': 'GEOCODED',
      });
      expect(value?.latitude, 51.23);
      expect(value?.longitude, 51.37);
    });
  });
}
