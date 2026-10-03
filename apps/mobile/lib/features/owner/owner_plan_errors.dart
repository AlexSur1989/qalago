import 'package:dio/dio.dart';

import '../../core/locale/consumer_api_errors.dart';
import '../../l10n/app_localizations.dart';

const ownerPlanDowngradeNotAllowedCode = 'PLAN_DOWNGRADE_NOT_ALLOWED';

String? extractPlanApiErrorCode(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final code = data['code'];
      if (code is String) return code;
      final message = data['message'];
      if (message is Map && message['code'] is String) {
        return message['code'] as String;
      }
      if (message is String && message.contains('PLAN_')) {
        return message;
      }
    }
  }
  final text = error.toString();
  if (text.contains(ownerPlanDowngradeNotAllowedCode)) {
    return ownerPlanDowngradeNotAllowedCode;
  }
  return null;
}

String mapOwnerPlanPurchaseError(AppLocalizations l10n, Object error) {
  final code = extractPlanApiErrorCode(error);
  if (code == ownerPlanDowngradeNotAllowedCode) {
    return l10n.ownerPlanDowngradeNotAllowed;
  }
  return localizedConsumerError(l10n, error);
}
