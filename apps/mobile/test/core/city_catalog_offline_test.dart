import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';

void main() {
  test('resolveCityCatalogList returns offline taxonomy when fetch fails', () async {
    final cities = await resolveCityCatalogList(
      () async => throw Exception('network'),
    );
    expect(cities.any((c) => c['slug'] == 'uralsk'), isTrue);
    expect(cities.firstWhere((c) => c['slug'] == 'uralsk')['nameKk'], 'Орал');
  });

  test('offlineCityCatalogMaps is non-empty for production fallback', () {
    expect(offlineCityCatalogMaps(), isNotEmpty);
  });

  test('offline astana is COMING_SOON', () {
    final astana = offlineCityBySlug('astana');
    expect(astana['launchStatus'], 'COMING_SOON');
  });
}
