import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/network/api_error_code.dart';

void main() {
  test('extractApiErrorCode reads top-level code', () {
    final code = extractApiErrorCode(
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
    expect(code, 'REPORT_ALREADY_SUBMITTED');
  });
}
