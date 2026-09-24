import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';

BusinessModel _favoriteBusinessWithBranchFields() {
  return BusinessModel(
    id: 'biz-fav',
    title: 'Favorite place',
    slug: 'favorite-place',
    address: 'Primary street',
    locationId: 'loc-l2',
    contextLocationId: 'loc-l2',
  );
}

Uri _favoriteRouteUri(BusinessModel business) {
  return businessDetailRouteUri(
    business.id,
    BusinessTrafficSource.favorites,
  );
}

void main() {
  group('openBusinessFromFavorite route (A.9.3.3)', () {
    test('A — branch fields on model do not add locationId to route', () {
      final business = _favoriteBusinessWithBranchFields();
      final uri = _favoriteRouteUri(business);

      expect(uri.path, '/business/biz-fav');
      expect(uri.queryParameters['source'], 'FAVORITES');
      expect(uri.queryParameters.containsKey('locationId'), isFalse);
      expect(uri.toString(), isNot(contains('locationId=loc-l2')));
    });

    test('B — model without branch fields same behavior', () {
      final business = BusinessModel(
        id: 'biz-plain',
        title: 'Plain',
        slug: 'plain',
        address: 'Addr',
      );
      final uri = _favoriteRouteUri(business);

      expect(uri.queryParameters['source'], 'FAVORITES');
      expect(uri.queryParameters.containsKey('locationId'), isFalse);
    });

    test('C — favorites traffic source preserved', () {
      final uri = _favoriteRouteUri(_favoriteBusinessWithBranchFields());
      expect(uri.queryParameters['source'], BusinessTrafficSource.favorites.apiValue);
    });
  });

  group('discovery vs favorites isolation', () {
    test('discovery contextLocationId encodes as locationId', () {
      const contextLocationId = 'loc-l2';
      final uri = businessDetailRouteUri(
        'biz-d',
        BusinessTrafficSource.search,
        selectedLocationId: contextLocationId,
      );
      expect(uri.queryParameters['locationId'], contextLocationId);
      expect(uri.queryParameters['source'], 'SEARCH');
    });
  });

  group('promotion navigation URI', () {
    test('SELECTED promotion contextLocationId -> locationId', () {
      final uri = businessDetailRouteUri(
        'biz-p',
        BusinessTrafficSource.promotions,
        selectedLocationId: 'loc-l2',
      );
      expect(uri.queryParameters['locationId'], 'loc-l2');
    });

    test('ALL promotion null context -> no locationId', () {
      final uri = businessDetailRouteUri(
        'biz-p',
        BusinessTrafficSource.promotions,
      );
      expect(uri.queryParameters.containsKey('locationId'), isFalse);
    });
  });
}
