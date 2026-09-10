import 'package:flutter/material.dart';

import '../../core/rbac/business_access.dart';

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

Map<String, dynamic> ownerAnalyticsCapabilities(Map<String, dynamic> dashboard) {
  final caps = dashboard['capabilities'];
  if (caps is Map<String, dynamic>) return caps;
  if (caps is Map) return Map<String, dynamic>.from(caps);
  return const {};
}

bool ownerAnalyticsCap(Map<String, dynamic> dashboard, String key) {
  return ownerAnalyticsCapabilities(dashboard)[key] == true;
}

List<int> ownerAnalyticsPeriodOptions(Map<String, dynamic>? dashboard) {
  final maxDays =
      (ownerAnalyticsCapabilities(dashboard ?? const {})['maxDays'] as num?)?.toInt() ?? 30;
  final options = [7, 30, 90, 365].where((days) => days <= maxDays).toList();
  return options.isEmpty ? [maxDays] : options;
}

int ownerAnalyticsEffectiveDays(Map<String, dynamic> dashboard, int requestedDays) {
  final effective =
      (dashboard['effectiveRange'] as Map?)?['days'] as num?;
  if (effective != null) return effective.toInt();
  final maxDays =
      (ownerAnalyticsCapabilities(dashboard)['maxDays'] as num?)?.toInt() ?? 30;
  return requestedDays > maxDays ? maxDays : requestedDays;
}

IconData ownerAnalyticsActionIcon(String key) {
  switch (key) {
    case 'calls':
      return Icons.phone_outlined;
    case 'whatsapp':
      return Icons.chat_outlined;
    case 'routes':
      return Icons.directions_outlined;
    case 'website':
      return Icons.language_outlined;
    case 'instagram':
      return Icons.camera_alt_outlined;
    case 'favorites':
      return Icons.favorite_border;
    default:
      return Icons.touch_app_outlined;
  }
}

String ownerAnalyticsActionLabel(String key) {
  switch (key) {
    case 'calls':
      return 'Звонки';
    case 'whatsapp':
      return 'WhatsApp';
    case 'routes':
      return 'Маршрут';
    case 'website':
      return 'Сайт';
    case 'instagram':
      return 'Instagram';
    case 'favorites':
      return 'В избранное';
    default:
      return key;
  }
}

/// Canonical business intent actions (Stage 6.6A.1) — excludes promotionViews.
const ownerAnalyticsIntentActionKeys = [
  'calls',
  'whatsapp',
  'routes',
  'website',
  'instagram',
  'favorites',
];

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
  if (rounded > 0) return '+$rounded% к предыдущему периоду';
  if (rounded < 0) return '$rounded% к предыдущему периоду';
  return '0% к предыдущему периоду';
}

String ownerAnalyticsFormatCount(num? value) {
  if (value == null) return '—';
  final n = value.toInt();
  final raw = n.abs().toString();
  final buffer = StringBuffer();
  if (n < 0) buffer.write('-');
  for (var i = 0; i < raw.length; i++) {
    if (i > 0 && (raw.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(raw[i]);
  }
  return buffer.toString();
}

/// Formats backend percent points (e.g. 33.3 → «33,3 %»), not 0–1 fractions.
String? ownerAnalyticsFormatRatePercent(num? percentPoints) {
  if (percentPoints == null) return null;
  if (percentPoints.isNaN || percentPoints.isInfinite) return null;
  final rounded = (percentPoints * 10).round() / 10;
  final text = rounded.toStringAsFixed(1).replaceAll('.', ',');
  return '$text %';
}

bool ownerAnalyticsCanExportReport(
  Map<String, dynamic> dashboard,
  BusinessAccess? access,
) {
  if (!ownerAnalyticsCap(dashboard, 'reportExport')) return false;
  if (access == null) return true;
  return hasPermission(access, BusinessPermission.analyticsExport);
}

String? ownerAnalyticsPrimaryUpgradeMessage(Map<String, dynamic> dashboard) {
  if (ownerAnalyticsIsLocked(dashboard, 'actions')) {
    return ownerAnalyticsLockedMessage(dashboard, 'actions');
  }
  if (ownerAnalyticsIsLocked(dashboard, 'sources')) {
    return 'Источники, поисковые запросы и CTR доступны в PRO';
  }
  if (ownerAnalyticsIsLocked(dashboard, 'audience')) {
    return 'Analytics 360 доступна в VIP';
  }
  return null;
}

bool ownerAnalyticsIsEmpty(Map<String, dynamic> dashboard) {
  final overview = dashboard['overview'];
  if (overview is! Map) return true;
  final views = (overview['views'] as num?)?.toInt() ?? 0;
  return views <= 0;
}

bool ownerAnalyticsPromotionActionsUnavailable(Map<String, dynamic>? promotions) {
  if (promotions == null) return false;
  if (promotions['actionsAvailable'] == false) return true;
  return false;
}

bool ownerAnalyticsCatalogActionsUnavailable(Map<String, dynamic>? catalog) {
  if (catalog == null) return false;
  if (catalog['actionsAvailable'] == false) return true;
  return false;
}

List<Map<String, dynamic>> ownerAnalyticsPopularHours(Map<String, dynamic>? popularTimes) {
  if (popularTimes == null) return const [];
  final raw = popularTimes['byHour'];
  if (raw is! List) return const [];
  return raw
      .whereType<Map>()
      .map((row) => Map<String, dynamic>.from(row))
      .where((row) => ((row['count'] as num?)?.toInt() ?? 0) > 0)
      .toList()
    ..sort(
      (a, b) => ((b['count'] as num?)?.toInt() ?? 0).compareTo(
        (a['count'] as num?)?.toInt() ?? 0,
      ),
    );
}
