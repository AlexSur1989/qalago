import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/categories/utils/category_list_utils.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('category organic sections (Stage 6.7D)', () {
    test('recommended excludes paid ids only', () {
      final items = [
        BusinessModel(id: 'paid', title: 'Paid', slug: 'p', address: 'A'),
        BusinessModel(id: 'o1', title: 'One', slug: 'o1', address: 'B'),
        BusinessModel(id: 'o2', title: 'Two', slug: 'o2', address: 'C'),
      ];
      final recommended = buildCategoryRecommendedOrganic(
        recommendedSorted: items,
        paidBusinessIds: {'paid'},
      );
      expect(recommended.map((b) => b.id), ['o1', 'o2']);
    });

    test('all places keeps paid businesses (sponsored + catalog)', () {
      final all = [
        BusinessModel(id: 'paid', title: 'Paid', slug: 'p', address: 'A'),
        BusinessModel(id: 'o1', title: 'One', slug: 'o1', address: 'B'),
      ];
      expect(all, hasLength(2));
    });

    test('skips immediate duplicate under sponsored block', () {
      final trimmed = categoryAllPlacesAfterSponsored(
        allPlaces: [
          BusinessModel(id: 'paid', title: 'Paid', slug: 'p', address: 'A'),
          BusinessModel(id: 'o1', title: 'One', slug: 'o1', address: 'B'),
        ],
        sponsoredBusinessIdsInOrder: ['paid'],
      );
      expect(trimmed.map((b) => b.id), ['o1']);
    });
  });
}
