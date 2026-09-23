import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';
import 'package:qalago_mobile/shared/utils/consumer_discovery_utils.dart';

void main() {
  group('BusinessModel contextLocationId (A.7.9.5)', () {
    test('parses contextLocationId from JSON', () {
      final model = BusinessModel.fromJson({
        'id': 'b1',
        'title': 'T',
        'slug': 't',
        'address': 'A',
        'contextLocationId': 'loc-aktobe',
      });
      expect(model.contextLocationId, 'loc-aktobe');
    });

    test('missing contextLocationId parses null', () {
      final model = BusinessModel.fromJson({
        'id': 'b1',
        'title': 'T',
        'slug': 't',
        'address': 'A',
      });
      expect(model.contextLocationId, isNull);
    });

    test('businessWithDistance preserves contextLocationId', () {
      final business = BusinessModel(
        id: 'b1',
        title: 'T',
        slug: 't',
        address: 'A',
        contextLocationId: 'loc-2',
        latitude: 51.0,
        longitude: 51.1,
        distanceMeters: 100,
      );
      final withDist = businessWithDistance(
        business,
        userLat: 51.0,
        userLng: 51.0,
      );
      expect(withDist.contextLocationId, 'loc-2');
    });
  });

  group('PromotionModel contextLocationId', () {
    test('parses contextLocationId', () {
      final promo = PromotionModel.fromJson({
        'id': 'p1',
        'title': 'Promo',
        'contextLocationId': 'loc-l2',
        'businessId': 'b1',
        'business': {
          'id': 'b1',
          'title': 'B',
          'slug': 'b',
          'address': 'addr',
        },
      });
      expect(promo.contextLocationId, 'loc-l2');
    });
  });

  group('discovery navigation URI', () {
    test('openBusiness encodes context as locationId query param', () {
      final uri = Uri(
        path: '/business/b1',
        queryParameters: {
          'source': 'search',
          'locationId': 'loc-branch',
        },
      );
      expect(parseSelectedLocationIdFromRoute(uri.queryParameters['locationId']),
          'loc-branch');
    });

    test('map uses locationId field not contextLocationId', () {
      final mapRow = BusinessModel.fromJson({
        'id': 'b1',
        'title': 'T',
        'slug': 't',
        'address': 'A',
        'locationId': 'loc-map',
        'contextLocationId': 'loc-discovery',
      });
      expect(mapRow.locationId, 'loc-map');
      expect(mapRow.contextLocationId, 'loc-discovery');
    });
  });
}
