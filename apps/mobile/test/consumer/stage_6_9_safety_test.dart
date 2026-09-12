import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/utils/safety_error_utils.dart';

void main() {
  test('maps sole-owner deletion conflict code', () {
    final error = DioException(
      requestOptions: RequestOptions(path: '/users/me'),
      response: Response(
        requestOptions: RequestOptions(path: '/users/me'),
        statusCode: 409,
        data: {
          'message': 'ownership',
          'code': 'BUSINESS_OWNERSHIP_REQUIRES_RESOLUTION',
        },
      ),
    );
    expect(
      mapAccountDeletionError(error),
      contains('управление'),
    );
  });

  test('legal flags default off in release constants path', () {
    expect(defaultSafetyFeatureFlagsOff, isTrue);
  });
}
