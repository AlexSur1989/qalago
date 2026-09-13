import 'package:dio/dio.dart';

import '../../l10n/app_localizations.dart';

/// Maps catalog/home load failures to localized consumer copy.
String localizedLoadError(AppLocalizations l10n, Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return l10n.errorLoadFailed;
      default:
        break;
    }
    final status = error.response?.statusCode;
    if (status != null && status >= 500) {
      return l10n.errorServiceUnavailable;
    }
  }
  final text = error.toString();
  if (text.contains('SocketException') ||
      text.contains('Connection') ||
      text.contains('DioException')) {
    return l10n.errorLoadFailed;
  }
  return l10n.errorLoadFailed;
}

/// Maps known API / transport failures to localized consumer copy.
String localizedConsumerError(AppLocalizations l10n, Object error) {
  final raw = error.toString().toLowerCase();
  if (raw.contains('invalid_otp') ||
      raw.contains('invalid otp') ||
      raw.contains('неверный код') ||
      raw.contains('wrong code')) {
    return l10n.errorInvalidOtp;
  }
  if (raw.contains('401') || raw.contains('unauthorized')) {
    return l10n.errorUnauthorized;
  }
  if (raw.contains('403') || raw.contains('forbidden')) {
    return l10n.errorForbidden;
  }
  if (raw.contains('404') || raw.contains('not found') || raw.contains('not_found')) {
    return l10n.errorNotFound;
  }
  if (raw.contains('timeout') || raw.contains('timed out')) {
    return l10n.errorTimeout;
  }
  if (raw.contains('429') || raw.contains('rate limit') || raw.contains('too many')) {
    return l10n.errorRateLimited;
  }
  if (raw.contains('socket') ||
      raw.contains('network') ||
      raw.contains('connection') ||
      raw.contains('failed host lookup')) {
    return l10n.errorNetwork;
  }
  return l10n.commonSomethingWrong;
}
