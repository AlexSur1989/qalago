import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/map_discovery_scope.dart';

void main() {
  group('resolveMapBusinessesFetchParams', () {
    const scope = MapDiscoveryScope(
      categoryId: 'cat-auto',
      subcategoryId: 'sub-wash',
    );

    test('G: flag OFF → city-only (legacy map)', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: false,
        scope: scope,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, isNull);
      expect(p.subcategoryId, isNull);
    });

    test('C: no subcategory selected → city-only', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: true,
        scope: null,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, isNull);
      expect(p.subcategoryId, isNull);
    });

    test('H: flag ON + scope → category and subcategory', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: true,
        scope: scope,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, 'cat-auto');
      expect(p.subcategoryId, 'sub-wash');
    });
  });
}
