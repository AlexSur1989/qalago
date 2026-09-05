bool ownerAnalyticsIsLocked(Map<String, dynamic> dashboard, String sectionId) {
  final locked = dashboard['lockedSections'];
  if (locked is! List) return false;
  for (final item in locked) {
    if (item is Map && item['id'] == sectionId) return true;
  }
  return false;
}

String? ownerAnalyticsLockedMessage(Map<String, dynamic> dashboard, String sectionId) {
  final locked = dashboard['lockedSections'];
  if (locked is! List) return null;
  for (final item in locked) {
    if (item is Map && item['id'] == sectionId) {
      return item['message'] as String?;
    }
  }
  return null;
}

List<int> ownerAnalyticsPeriodOptions(Map<String, dynamic>? dashboard) {
  final caps = dashboard?['capabilities'];
  final maxDays = (caps is Map ? caps['maxDays'] : null) as num? ?? 30;
  final options = [7, 30, 90, 365].where((days) => days <= maxDays).toList();
  return options.isEmpty ? [maxDays.toInt()] : options;
}

String ownerAnalyticsActionLabel(String key) {
  switch (key) {
    case 'total':
      return 'Всего действий';
    case 'calls':
      return 'Звонки';
    case 'whatsapp':
      return 'WhatsApp';
    case 'routes':
      return 'Маршруты';
    case 'website':
      return 'Сайт';
    case 'instagram':
      return 'Instagram';
    case 'favorites':
      return 'Избранное';
    case 'promotionViews':
      return 'Просмотры акций';
    default:
      return key;
  }
}

List<MapEntry<String, int>> ownerAnalyticsTrendSeries(
  Map<String, dynamic>? trends,
  String key,
) {
  if (trends == null) return const [];
  final raw = trends[key];
  if (raw is! List) return const [];
  return raw
      .whereType<Map>()
      .map(
        (item) => MapEntry(
          item['date'] as String? ?? '',
          (item['count'] as num?)?.toInt() ?? 0,
        ),
      )
      .where((entry) => entry.key.isNotEmpty)
      .toList();
}

String? ownerAnalyticsDeltaPercent(num? value) {
  if (value == null) return null;
  final rounded = value.round();
  if (rounded > 0) return '+$rounded%';
  return '$rounded%';
}

const ownerAnalyticsActionKeys = [
  'calls',
  'whatsapp',
  'routes',
  'website',
  'instagram',
  'favorites',
  'promotionViews',
];
