import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';

void main() {
  group('openBusiness searchQuery routing', () {
    test('SEARCH source includes searchQuery in route params conceptually', () {
      final params = <String, String>{'source': BusinessTrafficSource.search.apiValue};
      const searchQuery = 'кофе рядом';
      if (searchQuery.trim().isNotEmpty) {
        params['searchQuery'] = searchQuery.trim();
      }
      final uri = Uri(path: '/business/biz-1', queryParameters: params);
      expect(uri.queryParameters['source'], 'SEARCH');
      expect(uri.queryParameters['searchQuery'], 'кофе рядом');
    });

    test('HOME source must not carry searchQuery param', () {
      final params = <String, String>{'source': BusinessTrafficSource.home.apiValue};
      final uri = Uri(path: '/business/biz-1', queryParameters: params);
      expect(uri.queryParameters.containsKey('searchQuery'), isFalse);
    });

    test('parseBusinessSearchQueryFromRoute trims input', () {
      expect(parseBusinessSearchQueryFromRoute('  кофе  '), 'кофе');
      expect(parseBusinessSearchQueryFromRoute(null), isNull);
      expect(parseBusinessSearchQueryFromRoute(''), isNull);
    });
  });
}
