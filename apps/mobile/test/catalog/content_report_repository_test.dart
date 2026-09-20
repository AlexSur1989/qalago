import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';

void main() {
  test('submitReviewReport serializes REVIEW target payload', () async {
    final dio = Dio();
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          expect(options.path, '/reports');
          expect(options.method, 'POST');
          final body = options.data as Map<String, dynamic>;
          expect(body['targetType'], 'REVIEW');
          expect(body['targetId'], 'rev-1');
          expect(body['reason'], 'SPAM');
          handler.resolve(
            Response(
              requestOptions: options,
              data: {'reportId': 'r1', 'caseId': 'c1'},
            ),
          );
        },
      ),
    );
    final repo = ContentReportRepository(dio);
    final result = await repo.submitReviewReport(
      reviewId: 'rev-1',
      reason: 'SPAM',
    );
    expect(result.reportId, 'r1');
    expect(result.caseId, 'c1');
  });
}
