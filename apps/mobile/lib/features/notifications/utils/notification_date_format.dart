import 'package:intl/intl.dart';

import '../../../l10n/app_localizations.dart';

/// Compact notification timestamp (today → time, older → short date).
String formatNotificationDateTime(AppLocalizations l10n, DateTime? date) {
  if (date == null) return '';
  final locale = l10n.localeName;
  final local = date.toLocal();
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(local.year, local.month, local.day);
  if (day == today) {
    return DateFormat.Hm(locale).format(local);
  }
  if (local.year == now.year) {
    return DateFormat('d MMM', locale).format(local);
  }
  return DateFormat('d MMM yyyy', locale).format(local);
}
