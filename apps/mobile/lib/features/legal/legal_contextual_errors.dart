import 'package:dio/dio.dart';

import '../../l10n/app_localizations.dart';

String? _safetyErrorCode(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final code = data['code'];
      if (code is String) return code;
    }
  }
  final text = error.toString();
  for (final code in [
    'LEGAL_ACCEPTANCE_REQUIRED',
    'LEGAL_VERSION_STALE',
    'LEGAL_DOCUMENT_NOT_PUBLISHED',
  ]) {
    if (text.contains(code)) return code;
  }
  return null;
}

String mapContextualLegalError(AppLocalizations l10n, Object error) {
  switch (_safetyErrorCode(error)) {
    case 'LEGAL_VERSION_STALE':
      return l10n.contextualLegalVersionStale;
    case 'LEGAL_DOCUMENT_NOT_PUBLISHED':
      return l10n.contextualLegalUnavailable;
    case 'LEGAL_ACCEPTANCE_REQUIRED':
      return l10n.contextualLegalConfirmRequired;
    default:
      return l10n.legalAcceptanceError;
  }
}
