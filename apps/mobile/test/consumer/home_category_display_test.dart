import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/categories/data/home_category_display.dart';
import 'package:qalago_mobile/shared/models/models.dart';

CategoryModel _cat(int i) => CategoryModel(
      id: 'c$i',
      title: 'Cat $i',
      slug: 'c$i',
    );

void main() {
  test('sliceHomeCategories shows more when exceeding two rows', () {
    final all = List.generate(10, _cat);
    final slice = sliceHomeCategories(all, 4);
    expect(slice.preview.length, 7);
    expect(slice.showMore, isTrue);
  });

  test('sliceHomeCategories fits small lists without more', () {
    final all = List.generate(6, _cat);
    final slice = sliceHomeCategories(all, 4);
    expect(slice.preview.length, 6);
    expect(slice.showMore, isFalse);
  });
}
