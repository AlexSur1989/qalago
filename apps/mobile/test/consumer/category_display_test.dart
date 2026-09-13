import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  test('CategoryModel RU displayName', () {
    final cat = CategoryModel.fromJson({
      'id': '1',
      'title': 'Legacy',
      'nameRu': 'Красота',
      'nameKk': 'Сұлулық',
      'slug': 'beauty',
    });
    expect(cat.displayName(localeCode: 'ru'), 'Красота');
  });

  test('CategoryModel KZ displayName', () {
    final cat = CategoryModel.fromJson({
      'id': '1',
      'title': 'Красота',
      'nameRu': 'Красота',
      'nameKk': 'Сұлулық',
      'slug': 'beauty',
    });
    expect(cat.displayName(localeCode: 'kk'), 'Сұлулық');
  });

  test('CategoryModel legacy title-only JSON fallback', () {
    final cat = CategoryModel.fromJson({
      'id': '1',
      'title': 'Фитнес',
      'slug': 'fitness',
    });
    expect(cat.displayName(localeCode: 'ru'), 'Фитнес');
    expect(cat.nameRu, 'Фитнес');
  });
}
