import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_business_location.dart';
import 'package:qalago_mobile/shared/models/business_branch_location.dart';

void main() {
  group('buildCreateOwnerBusinessLocationPayload', () {
    test('create payload includes city, address, contacts, hours', () {
      final payload = buildCreateOwnerBusinessLocationPayload(
        cityId: 'city-1',
        address: '  Main st  ',
        latitude: 51.2,
        longitude: 51.3,
        locationSource: 'GEOCODED',
        workHours: buildOwnerLocationWorkHours(
          weekdays: '09:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed',
        ),
        phone: '+7',
        whatsapp: '',
        instagram: '@cafe',
        website: 'https://example.com',
      );
      expect(payload['cityId'], 'city-1');
      expect(payload['address'], 'Main st');
      expect(payload['latitude'], 51.2);
      expect(payload['workHours'], isA<Map>());
      expect(payload['phone'], '+7');
      expect(payload['whatsapp'], isNull);
    });
  });

  group('buildUpdateOwnerBusinessLocationPayload', () {
    test('edit payload respects profile vs hours split', () {
      final payload = buildUpdateOwnerBusinessLocationPayload(
        includeProfileFields: true,
        includeHours: false,
        cityId: 'city-1',
        address: 'Addr',
        phone: '1',
        whatsapp: null,
        instagram: null,
        website: null,
      );
      expect(payload.containsKey('workHours'), isFalse);
      expect(payload['address'], 'Addr');
    });

    test('hours-only patch omits address', () {
      final payload = buildUpdateOwnerBusinessLocationPayload(
        includeProfileFields: false,
        includeHours: true,
        address: 'ignored',
        workHours: buildOwnerLocationWorkHours(
          weekdays: '09:00-22:00',
          saturday: '09:00-22:00',
          sunday: '09:00-22:00',
        ),
      );
      expect(payload.keys, ['workHours']);
    });
  });

  group('owner location list', () {
    test('parses multiple branches and primary flag', () {
      final a = BusinessBranchLocation.fromJson({
        'id': 'l1',
        'businessId': 'b1',
        'cityId': 'c1',
        'address': 'A',
        'isPrimary': true,
      });
      final b = BusinessBranchLocation.fromJson({
        'id': 'l2',
        'businessId': 'b1',
        'cityId': 'c1',
        'address': 'B',
        'isPrimary': false,
      });
      expect(a.isPrimary, isTrue);
      expect(b.isPrimary, isFalse);
    });

    test('enrichOwnerLocationsWithCities fills city names', () {
      const loc = BusinessBranchLocation(
        id: 'l1',
        businessId: 'b1',
        cityId: 'c1',
        citySlug: '',
        cityNameRu: '',
        cityNameKk: '',
        address: 'Addr',
        isPrimary: true,
      );
      final enriched = enrichOwnerLocationsWithCities(
        [loc],
        [
          {
            'id': 'c1',
            'slug': 'uralsk',
            'nameRu': 'Уральск',
            'nameKk': 'Орал',
          },
        ],
      );
      expect(enriched.single.citySlug, 'uralsk');
      expect(enriched.single.cityNameRu, 'Уральск');
    });
  });

}
