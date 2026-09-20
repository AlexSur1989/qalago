import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/reviews/data/review_error_utils.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  final l10n = AppLocalizationsRu();

  test('maps duplicate report code from production filter wire shape', () {
    final message = mapReviewReportError(
      l10n,
      DioException(
        requestOptions: RequestOptions(path: '/reports'),
        response: Response(
          requestOptions: RequestOptions(path: '/reports'),
          statusCode: 409,
          data: {
            'statusCode': 409,
            'message': 'Report already submitted',
            'code': 'REPORT_ALREADY_SUBMITTED',
          },
        ),
      ),
    );
    expect(message, l10n.reviewReportAlreadySubmitted);
    expect(message, contains('жалобу'));
  });

  test('does not fall through to generic error when code is present', () {
    final message = mapReviewReportError(
      l10n,
      DioException(
        requestOptions: RequestOptions(path: '/reports'),
        type: DioExceptionType.badResponse,
        response: Response(
          requestOptions: RequestOptions(path: '/reports'),
          statusCode: 409,
          data: {
            'statusCode': 409,
            'message': 'Report already submitted',
            'code': 'REPORT_ALREADY_SUBMITTED',
          },
        ),
      ),
    );
    expect(message, isNot(l10n.commonSomethingWrong));
  });

  test('maps self-review forbidden on create', () {
    final message = mapReviewMutationError(
      l10n,
      DioException(
        requestOptions: RequestOptions(path: '/reviews'),
        response: Response(
          requestOptions: RequestOptions(path: '/reviews'),
          statusCode: 403,
          data: {'code': 'REVIEW_SELF_REVIEW_FORBIDDEN'},
        ),
      ),
    );
    expect(message, l10n.reviewSelfReviewForbidden);
  });
}
