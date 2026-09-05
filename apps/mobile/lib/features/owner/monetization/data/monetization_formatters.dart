import 'package:intl/intl.dart';

String formatKztPrice(num amount) {
  final value = amount.round();
  final formatted = value.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]} ',
      );
  return '$formatted ₸';
}

String formatMonetizationDate(DateTime date) {
  return DateFormat('dd.MM.yyyy').format(date);
}

String formatMonetizationDateRange(DateTime? start, DateTime? end) {
  if (start == null || end == null) return '—';
  final sameYear = start.year == end.year;
  if (sameYear && start.month == end.month) {
    return '${DateFormat('dd').format(start)} — ${DateFormat('dd MMM yyyy', 'ru').format(end)}';
  }
  if (sameYear) {
    return '${DateFormat('dd MMM', 'ru').format(start)} — ${DateFormat('dd MMM yyyy', 'ru').format(end)}';
  }
  return '${formatMonetizationDate(start)} — ${formatMonetizationDate(end)}';
}

String formatDurationLabel({int? durationDays, int? durationHours}) {
  if (durationDays != null && durationDays > 0) {
    return '$durationDays ${_daysLabel(durationDays)}';
  }
  if (durationHours != null && durationHours > 0) {
    return '$durationHours ч';
  }
  return '—';
}

String _daysLabel(int days) {
  final mod10 = days % 10;
  final mod100 = days % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 == 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}
