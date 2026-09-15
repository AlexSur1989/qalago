import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/categories/data/home_category_display.dart';
import 'package:qalago_mobile/shared/models/models.dart';

CategoryModel _cat(int i) => CategoryModel(
      id: 'c$i',
      title: 'Cat $i',
      nameRu: 'Cat $i',
      nameKk: 'Cat $i',
      slug: 'c$i',
    );

void main() {
  test('sliceHomeCategories exposes eight primaries and All action', () {
    final all = List.generate(10, _cat);
    final slice = sliceHomeCategories(all);
    expect(slice.preview.length, homePrimaryCategoryCount);
    expect(slice.showAllCategories, isTrue);
  });

  test('sliceHomeCategories keeps short lists with All action', () {
    final all = List.generate(6, _cat);
    final slice = sliceHomeCategories(all);
    expect(slice.preview.length, 6);
    expect(slice.showAllCategories, isTrue);
  });

  test('sliceHomeCategories empty list hides All', () {
    final slice = sliceHomeCategories([]);
    expect(slice.preview, isEmpty);
    expect(slice.showAllCategories, isFalse);
  });
}
