import '../../core/locale/consumer_api_errors.dart';
import '../../l10n/app_localizations.dart';

/// Safe owner profile / taxonomy save errors (no raw Dio/Prisma/JWT in UI).
String mapOwnerProfileSaveError(AppLocalizations l10n, Object error) {
  return localizedConsumerError(l10n, error);
}
