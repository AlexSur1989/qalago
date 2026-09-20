import 'package:intl/intl.dart';

String formatReviewDate(String localeCode, String raw) {
  final date = DateTime.tryParse(raw);
  if (date == null) return '';
  final locale = localeCode == 'kk' ? 'kk' : 'ru';
  return DateFormat('d MMM yyyy', locale).format(date.toLocal());
}
