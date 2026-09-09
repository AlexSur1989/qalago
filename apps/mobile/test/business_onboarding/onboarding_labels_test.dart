import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/business_onboarding/utils/onboarding_labels.dart';
import 'package:qalago_mobile/features/business_onboarding/utils/onboarding_errors.dart';

void main() {
  test('application status labels', () {
    expect(applicationStatusLabel('PENDING'), 'На проверке');
    expect(applicationStatusLabel('DRAFT'), 'Черновик');
  });

  test('claim status labels', () {
    expect(claimStatusLabel('APPROVED'), 'Одобрено');
  });

  test('membership role labels', () {
    expect(membershipRoleLabel('OWNER'), 'Владелец');
    expect(membershipRoleLabel('MANAGER'), 'Менеджер');
  });

  test('maps duplicate onboarding errors', () {
    expect(
      mapOnboardingError('duplicate business already exists'),
      contains('Похожий бизнес'),
    );
  });
}
