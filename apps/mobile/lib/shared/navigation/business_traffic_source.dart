/// Explicit consumer navigation source for business-detail opens (Stage 5H).
enum BusinessTrafficSource {
  home('HOME'),
  search('SEARCH'),
  category('CATEGORY'),
  map('MAP'),
  promotions('PROMOTIONS'),
  favorites('FAVORITES'),
  ad('AD'),
  direct('DIRECT'),
  unknown('UNKNOWN');

  const BusinessTrafficSource(this.apiValue);

  final String apiValue;

  static BusinessTrafficSource? tryParse(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    for (final source in BusinessTrafficSource.values) {
      if (source.apiValue == raw) return source;
    }
    return null;
  }

  static BusinessTrafficSource parseOrDirect(String? raw) =>
      tryParse(raw) ?? BusinessTrafficSource.direct;
}

String businessTrafficSourceLabel(BusinessTrafficSource source) {
  switch (source) {
    case BusinessTrafficSource.home:
      return 'Главная';
    case BusinessTrafficSource.search:
      return 'Поиск';
    case BusinessTrafficSource.category:
      return 'Категории';
    case BusinessTrafficSource.map:
      return 'Карта';
    case BusinessTrafficSource.promotions:
      return 'Акции';
    case BusinessTrafficSource.favorites:
      return 'Избранное';
    case BusinessTrafficSource.ad:
      return 'Реклама';
    case BusinessTrafficSource.direct:
      return 'Прямые переходы';
    case BusinessTrafficSource.unknown:
      return 'Неизвестно';
  }
}
