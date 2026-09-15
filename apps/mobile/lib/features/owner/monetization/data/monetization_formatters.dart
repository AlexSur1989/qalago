import 'package:intl/intl.dart';

import '../../../../l10n/app_localizations.dart';
import '../../utils/owner_l10n.dart' as owner_l10n;
import 'monetization_models.dart';

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

String formatDurationLabel(AppLocalizations l10n, {int? durationDays, int? durationHours}) =>
    owner_l10n.formatDurationLabel(l10n, durationDays: durationDays, durationHours: durationHours);

String monetizationPurchaseStateDetail(AppLocalizations l10n, MonetizationPurchaseState state) {
  if (state.state == 'ACTIVE' && state.activeUntil != null) {
    return l10n.ownerActiveUntil(formatMonetizationDate(state.activeUntil!));
  }
  if (state.state == 'SCHEDULED' &&
      state.scheduledStart != null &&
      state.scheduledEnd != null) {
    return l10n.ownerScheduledRange(
      formatMonetizationDate(state.scheduledStart!),
      formatMonetizationDate(state.scheduledEnd!),
    );
  }
  if (state.state == 'SOLD_OUT' && state.nextAvailableAt != null) {
    return l10n.ownerNextAvailableDate(formatMonetizationDate(state.nextAvailableAt!));
  }
  if (state.reservationExpiresAt != null && state.state == 'PENDING_PAYMENT') {
    return l10n.ownerReservedUntil(formatMonetizationDate(state.reservationExpiresAt!));
  }
  return '';
}
