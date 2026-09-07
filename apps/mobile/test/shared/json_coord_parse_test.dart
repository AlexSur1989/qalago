import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('Prisma Decimal string coords from API', () {
    test('BusinessModel parses string latitude/longitude', () {
      final model = BusinessModel.fromJson({
        'id': 'cmpn1wnpt000cult8zzvrr409',
        'title': 'Coffee House Uralsk',
        'slug': 'coffee-house-uralsk',
        'address': 'ул. Достык, 12, Уральск',
        'latitude': '51.2285',
        'longitude': '51.3842',
      });

      expect(model.latitude, closeTo(51.2285, 0.0001));
      expect(model.longitude, closeTo(51.3842, 0.0001));
    });

    test('PaginatedBusinesses parses items with string coords', () {
      final page = PaginatedBusinesses.fromJson({
        'items': [
          {
            'id': 'biz-1',
            'title': 'Coffee House Uralsk',
            'slug': 'coffee-house-uralsk',
            'address': 'A',
            'latitude': '51.2285',
            'longitude': '51.3842',
            'distanceMeters': 125,
          },
        ],
        'meta': {'total': 10},
      });

      expect(page.items, hasLength(1));
      expect(page.items.first.latitude, closeTo(51.2285, 0.0001));
      expect(page.items.first.distanceMeters, 125);
    });

    test('HOME_FEATURED ad business maps to BusinessModel', () {
      final item = AdItemModel.fromJson({
        'campaignId': 'camp-1',
        'placementId': 'pl-1',
        'placementCode': 'HOME_FEATURED',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'productType': 'FEATURED_BUSINESS',
        'business': {
          'id': 'cmpn1wnpt000cult8zzvrr409',
          'title': 'Coffee House Uralsk',
          'slug': 'coffee-house-uralsk',
          'address': 'ул. Достык, 12, Уральск',
          'latitude': '51.2285',
          'longitude': '51.3842',
        },
      });

      final business = item.toBusinessModel();
      expect(business, isNotNull);
      expect(business!.latitude, closeTo(51.2285, 0.0001));
    });
  });
}
