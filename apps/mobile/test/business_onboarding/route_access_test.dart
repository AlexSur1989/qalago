import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';

void main() {
  test('business onboarding routes require auth', () {
    expect(isBusinessOnboardingRoute('/business/start'), isTrue);
    expect(isBusinessOnboardingRoute('/business/search'), isTrue);
    expect(isBusinessOnboardingRoute('/business/apply'), isTrue);
    expect(isBusinessOnboardingRoute('/business/applications'), isTrue);
    expect(isBusinessOnboardingRoute('/business/claims'), isTrue);
    expect(isBusinessOnboardingRoute('/business/abc123/claim'), isTrue);
    expect(isBusinessOnboardingRoute('/business/abc123'), isFalse);
  });
}
