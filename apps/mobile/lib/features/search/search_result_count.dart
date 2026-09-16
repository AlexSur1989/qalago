import '../../l10n/app_localizations.dart';
import '../../shared/models/models.dart';

/// Localized result count — honest when API total exceeds loaded page size.
String formatSearchResultCount(AppLocalizations l10n, PaginatedBusinesses data) {
  if (data.total <= data.items.length) {
    return l10n.searchFoundCount(data.total);
  }
  return l10n.searchFoundCountPartial(data.items.length, data.total);
}
