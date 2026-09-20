import 'package:dio/dio.dart';

import '../../../l10n/app_localizations.dart';
import '../../../core/locale/consumer_api_errors.dart';
import '../../../core/network/api_error_code.dart';

String mapReviewMutationError(AppLocalizations l10n, Object error) {
  final code = _responseCode(error);
  switch (code) {
    case 'REVIEW_ALREADY_EXISTS':
      return l10n.reviewAlreadyExists;
    case 'REVIEW_SELF_REVIEW_FORBIDDEN':
      return l10n.reviewSelfReviewForbidden;
    case 'REVIEW_RATE_LIMITED':
      return l10n.errorRateLimited;
    default:
      return localizedConsumerError(l10n, error);
  }
}

String mapReviewReportError(AppLocalizations l10n, Object error) {
  final code = _responseCode(error);
  switch (code) {
    case 'REPORT_ALREADY_SUBMITTED':
      return l10n.reviewReportAlreadySubmitted;
    case 'CONTENT_NOT_REPORTABLE':
      return l10n.reviewReportNotReportable;
    default:
      if (error is DioException && error.response?.statusCode == 429) {
        return l10n.errorRateLimited;
      }
      return localizedConsumerError(l10n, error);
  }
}

String? _responseCode(Object error) => extractApiErrorCode(error);
