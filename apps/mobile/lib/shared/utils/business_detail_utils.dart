/// Consumer business detail helpers (Stage 5C).
library;

import '../../features/ads/utils/ad_url_utils.dart';

/// Kazakhstan business cities use UTC+5 (no DST since 2024).
const kDefaultBusinessTimezone = 'Asia/Oral';
const kKazakhstanUtcOffsetHours = 5;

enum BusinessOpenStatus { open, closed, unknown }

String? normalizeExternalDigits(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  var digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return null;
  if (digits.length == 11 && digits.startsWith('8')) {
    digits = '7${digits.substring(1)}';
  }
  return digits;
}

String? normalizeTelUri(String? phone) {
  final digits = normalizeExternalDigits(phone);
  if (digits == null || digits.length < 10) return null;
  return digits.startsWith('+') ? digits : '+$digits';
}

String? normalizeWhatsAppUrl(String? whatsapp) {
  final digits = normalizeExternalDigits(whatsapp);
  if (digits == null || digits.length < 10) return null;
  return 'https://wa.me/$digits';
}

String? normalizeWebsiteUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  var url = raw.trim();
  if (!url.contains('://')) url = 'https://$url';
  return isSafeHttpUrl(url) ? url : null;
}

String? normalizeInstagramUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final trimmed = raw.trim();
  if (isSafeHttpUrl(trimmed)) return trimmed;

  final handle = trimmed
      .replaceFirst(RegExp(r'^@'), '')
      .replaceFirst(RegExp(r'^https?://(www\.)?instagram\.com/'), '')
      .replaceAll('/', '')
      .trim();
  if (handle.isEmpty || handle.contains(' ') || handle.contains('.')) {
    return null;
  }
  final url = 'https://www.instagram.com/$handle/';
  return isSafeHttpUrl(url) ? url : null;
}

String? buildRouteUrl({
  double? latitude,
  double? longitude,
  String? address,
}) {
  if (latitude != null && longitude != null) {
    return 'https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude';
  }
  final trimmed = address?.trim();
  if (trimmed != null && trimmed.isNotEmpty) {
    return 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(trimmed)}';
  }
  return null;
}

String sanitizeDescription(String? raw) {
  if (raw == null) return '';
  var text = raw.trim();
  if (text.isEmpty) return '';
  text = text.replaceAll(RegExp(r'<[^>]*>'), ' ');
  text = text.replaceAll(RegExp(r'\s+'), ' ').trim();
  return text;
}

DateTime businessLocalNow({String? timezone}) {
  // MVP: Kazakhstan cities use fixed UTC+5.
  return DateTime.now().toUtc().add(const Duration(hours: kKazakhstanUtcOffsetHours));
}

int _minutesFromTime(String value) {
  final parts = value.split(':');
  if (parts.length != 2) return -1;
  final h = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (h == null || m == null) return -1;
  return h * 60 + m;
}

bool _isOpenForRange(int nowMinutes, int openMinutes, int closeMinutes) {
  if (openMinutes < 0 || closeMinutes < 0) return false;
  if (closeMinutes > openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }
  // Overnight e.g. 17:00–02:00
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

BusinessOpenStatus computeOpenStatus(dynamic workHours, {String? timezone}) {
  final map = _asHoursMap(workHours);
  if (map == null || map.isEmpty) return BusinessOpenStatus.unknown;

  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  final now = businessLocalNow(timezone: timezone);
  final key = keys[now.weekday - 1];
  final value = map[key];
  if (value == null) return BusinessOpenStatus.unknown;

  final nowMinutes = now.hour * 60 + now.minute;

  if (value is String) {
    if (value.trim().isEmpty) return BusinessOpenStatus.unknown;
    final lower = value.toLowerCase();
    if (lower.contains('закрыт') || lower == 'closed') {
      return BusinessOpenStatus.closed;
    }
    final parts = value.split('-');
    if (parts.length != 2) return BusinessOpenStatus.unknown;
    final open = _minutesFromTime(parts[0].trim());
    final close = _minutesFromTime(parts[1].trim());
    if (open < 0 || close < 0) return BusinessOpenStatus.unknown;
    return _isOpenForRange(nowMinutes, open, close)
        ? BusinessOpenStatus.open
        : BusinessOpenStatus.closed;
  }

  final day = _asHoursMap(value);
  if (day?['closed'] == true) return BusinessOpenStatus.closed;
  final open = _minutesFromTime(day?['open']?.toString() ?? '');
  final close = _minutesFromTime(day?['close']?.toString() ?? '');
  if (open < 0 || close < 0) return BusinessOpenStatus.unknown;
  return _isOpenForRange(nowMinutes, open, close)
      ? BusinessOpenStatus.open
      : BusinessOpenStatus.closed;
}

Map<String, dynamic>? _asHoursMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

List<Map<String, dynamic>> filterActivePromotions(List<dynamic> raw) {
  final now = DateTime.now().toUtc();
  return raw
      .map((item) => _asHoursMap(item))
      .whereType<Map<String, dynamic>>()
      .where((promo) {
        final endRaw = promo['endDate'];
        if (endRaw != null) {
          final end = DateTime.tryParse(endRaw.toString())?.toUtc();
          if (end != null && end.isBefore(now)) return false;
        }
        final startRaw = promo['startDate'];
        if (startRaw != null) {
          final start = DateTime.tryParse(startRaw.toString())?.toUtc();
          if (start != null && start.isAfter(now)) return false;
        }
        return true;
      })
      .toList();
}

List<(String, String)> weeklyHoursRows(dynamic raw, {DateTime? now}) {
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  final hours = _asHoursMap(raw);
  if (hours == null) return const [];

  final localNow = now ?? businessLocalNow();
  final todayIndex = localNow.weekday - 1;

  return List.generate(keys.length, (index) {
    final value = hours[keys[index]];
    String label = labels[index];
    if (index == todayIndex) label = '$label · сегодня';

    if (value == null) return (label, '—');
    if (value is String) {
      if (value.trim().isEmpty) return (label, '—');
      final lower = value.toLowerCase();
      if (lower.contains('закрыт') || lower == 'closed') {
        return (label, 'Закрыто');
      }
      return (label, value.replaceAll('-', ' – '));
    }
    final map = _asHoursMap(value);
    if (map?['closed'] == true) return (label, 'Закрыто');
    final open = map?['open']?.toString();
    final close = map?['close']?.toString();
    if (open == null || close == null) return (label, '—');
    return (label, '$open – $close');
  });
}

bool hasWorkHours(dynamic raw) {
  final hours = _asHoursMap(raw);
  if (hours == null || hours.isEmpty) return false;
  return hours.values.any((value) {
    if (value == null) return false;
    if (value is String) return value.trim().isNotEmpty;
    if (value is Map) return value.isNotEmpty;
    return true;
  });
}

(String, String) todayHoursLabel(dynamic raw, {String? timezone}) {
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const labels = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
  ];
  final hours = _asHoursMap(raw);
  if (hours == null) return ('Сегодня', 'Уточняйте');

  final now = businessLocalNow(timezone: timezone);
  final index = now.weekday - 1;
  final value = hours[keys[index]];
  if (value == null) return (labels[index], 'Уточняйте');
  if (value is String) {
    if (value.trim().isEmpty) return (labels[index], 'Уточняйте');
    final lower = value.toLowerCase();
    if (lower.contains('закрыт') || lower == 'closed') {
      return (labels[index], 'Закрыто');
    }
    return (labels[index], value.replaceAll('-', ' – '));
  }
  final map = _asHoursMap(value);
  if (map?['closed'] == true) return (labels[index], 'Закрыто');
  final open = map?['open']?.toString();
  final close = map?['close']?.toString();
  if (open == null || close == null) return (labels[index], 'Уточняйте');
  return (labels[index], '$open – $close');
}

String openStatusLabel(BusinessOpenStatus status) => switch (status) {
      BusinessOpenStatus.open => 'Открыто сейчас',
      BusinessOpenStatus.closed => 'Закрыто сейчас',
      BusinessOpenStatus.unknown => '',
    };

(double?, int) reviewStatsFromList(List<dynamic> reviews) {
  if (reviews.isEmpty) return (null, 0);
  var sum = 0;
  for (final raw in reviews) {
    if (raw is Map) {
      sum += (raw['rating'] as num?)?.toInt() ?? 0;
    } else {
      sum += (raw.rating as int?) ?? 0;
    }
  }
  return (sum / reviews.length, reviews.length);
}
