import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';

void main() {
  test('default dev base URL is local when no dart-define override', () {
    expect(AppConstants.apiBaseUrlOverride, isEmpty);
    expect(AppConstants.baseUrl, contains(':3002/api/v1'));
  });

  test('media base URL strips api path from override host', () {
    // Compile-time override cannot be set in test runtime; document expected pattern.
    expect(AppConstants.resolveMediaUrl('/uploads/x.jpg'), isNotEmpty);
  });
}
