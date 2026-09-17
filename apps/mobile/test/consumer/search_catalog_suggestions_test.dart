import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/search/search_catalog_suggestions.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  final categories = [
    CategoryModel(
      id: 'cat-beauty',
      title: 'Beauty',
      nameRu: 'Красота',
      nameKk: 'Сұлулық',
      slug: 'beauty',
    ),
    CategoryModel(
      id: 'cat-food',
      title: 'Food',
      nameRu: 'Рестораны',
      nameKk: 'Мейрамханалар',
      slug: 'food',
    ),
  ];

  final subcategories = [
    SubcategoryModel(
      id: 'sub-manicure',
      categoryId: 'cat-beauty',
      slug: 'manicure',
      nameRu: 'Маникюр и педикюр',
      nameKk: 'Маникюр',
    ),
  ];

  test('exact title ranks before contains', () {
    final results = buildSearchCatalogSuggestions(
      rawQuery: 'маникюр',
      categories: categories,
      subcategories: subcategories,
      localeCode: 'ru',
    );
    expect(results, isNotEmpty);
    expect(results.first.displayLabel, 'Маникюр и педикюр');
    expect(results.first.type, SearchCatalogSuggestionType.subcategory);
  });

  test('prefix ranks before contains for categories', () {
    final results = buildSearchCatalogSuggestions(
      rawQuery: 'рест',
      categories: categories,
      subcategories: const [],
      localeCode: 'ru',
    );
    expect(results.single.displayLabel, 'Рестораны');
  });

  test('Kazakh characters preserved in matching', () {
    final kkSubs = [
      SubcategoryModel(
        id: 'sub-kk',
        categoryId: 'cat-beauty',
        slug: 'kk',
        nameRu: 'RU',
        nameKk: 'балалар киімі',
        sortOrder: 0,
      ),
    ];
    final results = buildSearchCatalogSuggestions(
      rawQuery: 'балалар киімі',
      categories: const [],
      subcategories: kkSubs,
      localeCode: 'kk',
    );
    expect(results.single.displayLabel, 'балалар киімі');
  });

  test('respects suggestion limit', () {
    final many = List.generate(
      20,
      (i) => CategoryModel(
        id: 'c$i',
        title: 't$i',
        nameRu: 'маникюр $i',
        nameKk: 'маникюр $i',
        slug: 's$i',
      ),
    );
    final results = buildSearchCatalogSuggestions(
      rawQuery: 'маникюр',
      categories: many,
      subcategories: const [],
      localeCode: 'ru',
    );
    expect(results.length, kSearchCatalogSuggestionLimit);
  });

  test('KK display uses localized name', () {
    final results = buildSearchCatalogSuggestions(
      rawQuery: 'мейрам',
      categories: categories,
      subcategories: const [],
      localeCode: 'kk',
    );
    expect(results.single.displayLabel, 'Мейрамханалар');
  });
}
