import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';

void main() {
  group('BusinessTrafficSource', () {
    test('tryParse accepts all Stage 5H values', () {
      for (final source in BusinessTrafficSource.values) {
        expect(BusinessTrafficSource.tryParse(source.apiValue), source);
      }
    });

    test('parseOrDirect defaults missing source to DIRECT', () {
      expect(
        BusinessTrafficSource.parseOrDirect(null),
        BusinessTrafficSource.direct,
      );
    });

    test('labels are Russian owner-facing strings', () {
      expect(businessTrafficSourceLabel(BusinessTrafficSource.search), 'Поиск');
      expect(businessTrafficSourceLabel(BusinessTrafficSource.ad), 'Реклама');
      expect(
        businessTrafficSourceLabel(BusinessTrafficSource.unknown),
        'Неизвестно',
      );
    });
  });

  group('parseBusinessTrafficSourceFromRoute', () {
    test('HOME from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('HOME'),
        BusinessTrafficSource.home,
      );
    });

    test('SEARCH from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('SEARCH'),
        BusinessTrafficSource.search,
      );
    });

    test('CATEGORY from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('CATEGORY'),
        BusinessTrafficSource.category,
      );
    });

    test('MAP from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('MAP'),
        BusinessTrafficSource.map,
      );
    });

    test('PROMOTIONS from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('PROMOTIONS'),
        BusinessTrafficSource.promotions,
      );
    });

    test('FAVORITES from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('FAVORITES'),
        BusinessTrafficSource.favorites,
      );
    });

    test('AD from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('AD'),
        BusinessTrafficSource.ad,
      );
    });

    test('DIRECT from query param', () {
      expect(
        parseBusinessTrafficSourceFromRoute('DIRECT'),
        BusinessTrafficSource.direct,
      );
    });
  });
}
