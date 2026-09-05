import '../../shared/models/models.dart';

int ownerProfileCompletion(Map<String, dynamic> business) {
  const fields = [
    'title',
    'shortDesc',
    'description',
    'address',
    'phone',
    'whatsapp',
    'instagram',
    'website',
  ];
  var filled = 0;
  for (final key in fields) {
    final value = business[key];
    if (value is String && value.trim().isNotEmpty) filled++;
  }
  final workHours = business['workHours'];
  if (workHours is Map && workHours.isNotEmpty) filled++;
  if (business['coverImageUrl'] != null &&
      (business['coverImageUrl'] as String).isNotEmpty) {
    filled++;
  }
  final total = fields.length + 2;
  return ((filled / total) * 100).round();
}

String ownerFormatNumber(int value) {
  return value.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]} ',
      );
}

String? ownerFormatDelta(int current, int previous) {
  if (previous <= 0) return current > 0 ? '+100%' : null;
  final pct = (((current - previous) / previous) * 100).round();
  if (pct == 0) return '0%';
  return pct > 0 ? '+$pct%' : '$pct%';
}

Map<String, int> ownerByType(Map<String, dynamic>? summary) {
  if (summary == null) return {};
  final raw = summary['byType'];
  if (raw is! Map) return {};
  return raw.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0));
}

List<MapEntry<String, int>> aggregateViewTrends(List<dynamic> items) {
  final map = <String, int>{};
  for (final item in items) {
    if (item is! Map) continue;
    if (item['type'] != 'VIEW_BUSINESS') continue;
    final date = item['date'] as String? ?? '';
    if (date.isEmpty) continue;
    map[date] = (map[date] ?? 0) + ((item['count'] as num?)?.toInt() ?? 0);
  }
  final entries = map.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
  return entries;
}

List<String> buildDateRange(int days) {
  final result = <String>[];
  final today = DateTime.now();
  for (var i = days - 1; i >= 0; i--) {
    final d = DateTime(today.year, today.month, today.day).subtract(Duration(days: i));
    result.add(
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}',
    );
  }
  return result;
}

String ownerStatusLabel(String status) {
  switch (status) {
    case 'ACTIVE':
      return 'Активен';
    case 'PENDING':
      return 'На модерации';
    case 'BLOCKED':
      return 'Заблокирован';
    default:
      return status;
  }
}

bool ownerIsPromotionActiveStatus(String? status) => status == 'ACTIVE';

bool ownerIsPromotionLiveNow(PromotionModel promotion, {DateTime? now}) {
  if (!ownerIsPromotionActiveStatus(promotion.status)) return false;
  final current = now ?? DateTime.now();
  if (promotion.startDate != null && current.isBefore(promotion.startDate!)) {
    return false;
  }
  if (promotion.endDate != null && current.isAfter(promotion.endDate!)) {
    return false;
  }
  return true;
}

int ownerMaxPromotionsInFeed(Map<String, dynamic> plan) {
  final limits = plan['limits'] as Map<String, dynamic>? ?? {};
  return (limits['maxPromotionsInFeed'] as num?)?.toInt() ?? 0;
}

String ownerPromotionFeedHint(Map<String, dynamic> plan) {
  final feedLimit = ownerMaxPromotionsInFeed(plan);
  if (feedLimit <= 0) {
    return 'Видна на карточке · не в ленте города (Базовый тариф)';
  }
  return 'До $feedLimit акций в ленте города';
}

String ownerPromotionStatusLabel(PromotionModel promotion) {
  if (!ownerIsPromotionActiveStatus(promotion.status)) {
    return promotion.status ?? '—';
  }
  if (!ownerIsPromotionLiveNow(promotion)) {
    return 'Истекла';
  }
  return 'Активна';
}

String ownerNotificationTypeLabel(String type) {
  const map = {
    'REVIEW_NEW': 'Новый отзыв',
    'REVIEW_REPLY': 'Ответ на отзыв',
    'MODERATION': 'Модерация',
    'PROMOTION': 'Акция',
    'PLAN_ACTIVATED': 'Тариф',
    'PLAN_EXPIRED': 'Тариф',
    'GENERAL': 'Общее',
  };
  return map[type] ?? type.replaceAll('_', ' ');
}
