import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/business_branch_location.dart';

void main() {
  group('BusinessBranchLocation.fromJson', () {
    test('parses primary single location', () {
      final loc = BusinessBranchLocation.fromJson({
        'id': 'bl1',
        'businessId': 'b1',
        'cityId': 'c1',
        'city': {'slug': 'uralsk', 'nameRu': 'Уральск', 'nameKk': 'Орал'},
        'address': 'Addr 1',
        'isPrimary': true,
        'latitude': 51.2,
        'longitude': 51.3,
        'phone': '+7700',
      });
      expect(loc.isPrimary, isTrue);
      expect(loc.citySlug, 'uralsk');
      expect(loc.address, 'Addr 1');
    });

    test('cross-city secondary preserves isPrimary false', () {
      final loc = BusinessBranchLocation.fromJson({
        'id': 'bl2',
        'businessId': 'b1',
        'cityId': 'c2',
        'city': {'slug': 'aktobe', 'nameRu': 'Актобе', 'nameKk': 'Ақтөбе'},
        'address': 'Branch 2',
        'isPrimary': false,
      });
      expect(loc.isPrimary, isFalse);
      expect(loc.displayCityName(localeCode: 'ru'), 'Актобе');
    });
  });
}
