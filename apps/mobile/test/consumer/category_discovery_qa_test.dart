import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/categories/data/category_catalog_sort.dart';
import 'package:qalago_mobile/features/categories/data/category_discovery_strings.dart';

void main() {
  group('Stage 6.7QA category UX strings', () {
    test('sponsored vs organic section labels differ (RU)', () {
      expect(
        CategoryDiscoveryStrings.sectionTitle(
          CategoryDiscoveryStrings.recommendedSection,
        ),
        'Рекомендуем',
      );
      expect(
        CategoryDiscoveryStrings.sectionTitle(
          CategoryDiscoveryStrings.sponsoredSection,
        ),
        'Продвигаемые места',
      );
    });

    test('KZ strings available for sort options', () {
      expect(
        CategoryDiscoveryStrings.sortOptionLabel(
          CategoryCatalogSort.nearest,
          localeCode: 'kk',
        ),
        'Сізге жақын',
      );
    });
  });
}
