import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/map_discovery_scope.dart';

void main() {
  group('resolveMapBusinessesFetchParams', () {
    const autoAll = MapDiscoveryScope(categoryId: 'cat-auto');
    const autoWash = MapDiscoveryScope(
      categoryId: 'cat-auto',
      subcategoryId: 'sub-wash',
    );

    test('A: global Map — no scope → city-wide', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: true,
        scope: null,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, isNull);
      expect(p.subcategoryId, isNull);
    });

    test('B: Category AUTO + All → category only', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: true,
        scope: autoAll,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, 'cat-auto');
      expect(p.subcategoryId, isNull);
    });

    test('C: Category AUTO + CAR_WASH → category + subcategory', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: true,
        scope: autoWash,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, 'cat-auto');
      expect(p.subcategoryId, 'sub-wash');
    });

    test('D: Category AUTO + All, flag OFF → category only', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: false,
        scope: autoAll,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, 'cat-auto');
      expect(p.subcategoryId, isNull);
    });

    test('E: selected subcategory with flag OFF → sub ignored, category kept', () {
      final p = resolveMapBusinessesFetchParams(
        subcategoriesEnabled: false,
        scope: autoWash,
        citySlug: 'uralsk',
      );
      expect(p.categoryId, 'cat-auto');
      expect(p.subcategoryId, isNull);
    });
  });
}
