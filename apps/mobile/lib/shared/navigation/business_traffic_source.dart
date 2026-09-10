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

  /// Discovery surface for VIEW_BUSINESS attribution (Stage 6.5.1).
  String get openDiscoverySurface {
    switch (this) {
      case BusinessTrafficSource.search:
        return 'SEARCH_RESULTS';
      case BusinessTrafficSource.map:
        return 'MAP_PIN';
      case BusinessTrafficSource.home:
        return 'HOME_FEED';
      case BusinessTrafficSource.category:
        return 'CATEGORY_LIST';
      case BusinessTrafficSource.favorites:
        return 'FAVORITES_LIST';
      case BusinessTrafficSource.promotions:
        return 'PROMOTION_LIST';
      default:
        return 'BUSINESS_DETAIL';
    }
  }
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
