import 'category_catalog_sort.dart';

/// RU / KK copy for category discovery (no widget hardcoding).
class CategoryDiscoveryStrings {
  const CategoryDiscoveryStrings._();

  static const recommendedSection = _L10nPair(
    ru: 'Рекомендуем',
    kk: 'Ұсынамыз',
  );
  static const sponsoredSection = _L10nPair(
    ru: 'Продвигаемые места',
    kk: 'Жарнамалық орындар',
  );
  static const allPlacesSection = _L10nPair(
    ru: 'Все места',
    kk: 'Барлық орындар',
  );
  static const sortLabel = _L10nPair(ru: 'Сортировка', kk: 'Сұрыптау');
  static const emptyCategory = _L10nPair(
    ru: 'В этой категории пока нет мест',
    kk: 'Бұл санатта әлі орындар жоқ',
  );
  static const nearestNeedsLocation = _L10nPair(
    ru: 'Разрешите доступ к геопозиции, чтобы показать ближайшие места',
    kk: 'Ең жақын орындарды көрсету үшін геопозицияға рұқсат беріңіз',
  );

  static String sectionTitle(_L10nPair pair, {String localeCode = 'ru'}) =>
      pair.forLocale(localeCode);

  static String sortOptionLabel(CategoryCatalogSort sort, {String localeCode = 'ru'}) {
    final pair = switch (sort) {
      CategoryCatalogSort.recommended => const _L10nPair(
          ru: 'Рекомендуемые',
          kk: 'Ұсынылатын',
        ),
      CategoryCatalogSort.nearest => const _L10nPair(
          ru: 'Ближе к вам',
          kk: 'Сізге жақын',
        ),
      CategoryCatalogSort.rating => const _L10nPair(
          ru: 'По рейтингу',
          kk: 'Рейтинг бойынша',
        ),
      CategoryCatalogSort.popular => const _L10nPair(
          ru: 'Популярные',
          kk: 'Танымал',
        ),
    };
    return pair.forLocale(localeCode);
  }
}

class _L10nPair {
  const _L10nPair({required this.ru, required this.kk});

  final String ru;
  final String kk;

  String forLocale(String localeCode) {
    if (localeCode.startsWith('kk')) return kk;
    return ru;
  }
}
