import '../../core/locale/consumer_api_errors.dart';
import '../../l10n/app_localizations.dart';
import 'owner_business_location.dart';

String mapOwnerLocationError(AppLocalizations l10n, Object error) {
  final code = extractApiErrorCode(error);
  switch (code) {
    case ownerLocationLastDeleteBlockedCode:
      return l10n.ownerLocationErrorLastDelete;
    case ownerLocationPrimaryDeleteBlockedCode:
      return l10n.ownerLocationErrorPrimaryDelete;
  }
  return localizedConsumerError(l10n, error);
}
