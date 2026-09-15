import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_subcategory_edit.dart';

void main() {
  group('parseAssignedSubcategoryIds', () {
    test('reads ids from subcategories list', () {
      expect(
        parseAssignedSubcategoryIds({
          'subcategories': [
            {'id': 's1', 'nameRu': 'A'},
            {'id': 's2'},
          ],
        }),
        ['s1', 's2'],
      );
    });

    test('returns empty when missing', () {
      expect(parseAssignedSubcategoryIds({}), isEmpty);
    });
  });

  group('resolveBusinessCategoryId', () {
    test('prefers categoryId field', () {
      expect(
        resolveBusinessCategoryId({
          'categoryId': 'c1',
          'category': {'id': 'c2'},
        }),
        'c1',
      );
    });

    test('falls back to nested category', () {
      expect(
        resolveBusinessCategoryId({'category': {'id': 'c2'}}),
        'c2',
      );
    });
  });

  group('toggleSubcategorySelection', () {
    test('adds and removes ids', () {
      expect(toggleSubcategorySelection(const [], 'a'), ['a']);
      expect(toggleSubcategorySelection(['a'], 'a'), isEmpty);
      expect(toggleSubcategorySelection(['a'], 'b'), ['a', 'b']);
    });
  });

  group('PATCH isolation', () {
    test('profile patch omits subcategoryIds', () {
      final patch = buildOwnerProfileFieldsPatch({
        'title': 'T',
        'subcategoryIds': ['x'],
      });
      expect(patch.containsKey('subcategoryIds'), isFalse);
      expect(patch['title'], 'T');
    });

    test('subcategory patch sends list including empty clear', () {
      expect(buildSubcategoryIdsPatch(['a']), {'subcategoryIds': ['a']});
      expect(buildSubcategoryIdsPatch([]), {'subcategoryIds': <String>[]});
    });
  });

  group('listsEqualUnordered', () {
    test('compares membership', () {
      expect(listsEqualUnordered(['a', 'b'], ['b', 'a']), isTrue);
      expect(listsEqualUnordered(['a'], ['a', 'b']), isFalse);
    });
  });
}
