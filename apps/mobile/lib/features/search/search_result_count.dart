import '../../l10n/app_localizations.dart';
import '../../shared/models/models.dart';

/// Localized result count — honest when API total exceeds loaded page size.
String formatSearchResultCount(AppLocalizations l10n, PaginatedBusinesses data) {
  return formatSearchResultCountShown(
    l10n,
    shown: data.items.length,
    total: data.total,
  );
}

String formatSearchResultCountShown(
  AppLocalizations l10n, {
  required int shown,
  required int total,
}) {
  if (total <= shown) {
    return l10n.searchFoundCount(total);
  }
  return l10n.searchFoundCountPartial(shown, total);
}
