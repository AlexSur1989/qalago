/// Hex colors for native map circles (matches map pin category buckets).
abstract final class BusinessMapCategoryColors {
  static const defaultHex = '#00A8D6';

  static const Map<String, String> byCategoryKey = {
    'bar': defaultHex,
    'fitness': '#111827',
    'beauty': '#EC4899',
    'retail': defaultHex,
    'medical': '#22C55E',
    'kids': '#8B5CF6',
    'auto': '#2563EB',
    'default': defaultHex,
  };

  /// MapLibre `match` expression on GeoJSON `categoryKey`.
  static List<Object> circleColorExpression() {
    final pairs = <Object>[];
    for (final entry in byCategoryKey.entries) {
      if (entry.key == 'default') {
        continue;
      }
      pairs.addAll([entry.key, entry.value]);
    }
    pairs.add(defaultHex);
    return [
      'match',
      ['get', 'categoryKey'],
      ...pairs,
    ];
  }
}
