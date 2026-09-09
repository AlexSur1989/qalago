import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';

void main() {
  group('production safety compile-time flags', () {
    test('mock plan checkout disabled by default', () {
      expect(AppConstants.mockPlanCheckoutEnabled, isFalse);
    });

    test('dev login disabled by default', () {
      expect(AppConstants.devLoginEnabled, isFalse);
    });
  });
}
