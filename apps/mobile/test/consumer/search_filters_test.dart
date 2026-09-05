import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/search/search_filters.dart';

void main() {
  group('SearchRadiusMode', () {
    test('whole city has no radiusKm', () {
      expect(SearchRadiusMode.wholeCity.radiusKm, isNull);
      expect(SearchRadiusMode.wholeCity.routeParam, isNull);
    });

    test('radius modes expose fixed km values', () {
      expect(SearchRadiusMode.km3.radiusKm, 3);
      expect(SearchRadiusMode.km5.radiusKm, 5);
      expect(SearchRadiusMode.km10.radiusKm, 10);
      expect(SearchRadiusMode.km15.radiusKm, 15);
    });

    test('fromRadiusKmParam parses deep-link values', () {
      expect(SearchRadiusModeX.fromRadiusKmParam(null), SearchRadiusMode.wholeCity);
      expect(SearchRadiusModeX.fromRadiusKmParam(''), SearchRadiusMode.wholeCity);
      expect(SearchRadiusModeX.fromRadiusKmParam('3'), SearchRadiusMode.km3);
      expect(SearchRadiusModeX.fromRadiusKmParam('5'), SearchRadiusMode.km5);
      expect(SearchRadiusModeX.fromRadiusKmParam('10'), SearchRadiusMode.km10);
      expect(SearchRadiusModeX.fromRadiusKmParam('15'), SearchRadiusMode.km15);
      expect(SearchRadiusModeX.fromRadiusKmParam('99'), SearchRadiusMode.wholeCity);
    });
  });

  group('buildSearchRouteParams', () {
    test('whole city omits radiusKm', () {
      final params = buildSearchRouteParams(
        query: 'кофе',
        categoryId: 'cat1',
        radiusMode: SearchRadiusMode.wholeCity,
      );
      expect(params['q'], 'кофе');
      expect(params['categoryId'], 'cat1');
      expect(params.containsKey('radiusKm'), isFalse);
    });

    test('radius 3 km and 15 km are deep-linkable', () {
      expect(
        buildSearchRouteParams(radiusMode: SearchRadiusMode.km3)['radiusKm'],
        '3',
      );
      expect(
        buildSearchRouteParams(radiusMode: SearchRadiusMode.km15)['radiusKm'],
        '15',
      );
    });

    test('clear category omits categoryId', () {
      final params = buildSearchRouteParams(
        query: 'кофе',
        radiusMode: SearchRadiusMode.km5,
      );
      expect(params.containsKey('categoryId'), isFalse);
      expect(params['radiusKm'], '5');
    });
  });

  group('buildSearchFilterSummary', () {
    test('shows category and radius', () {
      expect(
        buildSearchFilterSummary(
          cityName: 'Уральск',
          categoryTitle: 'Кофейни',
          radiusMode: SearchRadiusMode.km5,
        ),
        'Кофейни · до 5 км',
      );
    });

    test('whole city uses city name', () {
      expect(
        buildSearchFilterSummary(
          cityName: 'Уральск',
          categoryTitle: 'Кофейни',
          radiusMode: SearchRadiusMode.wholeCity,
        ),
        'Кофейни · Уральск',
      );
    });
  });
}
