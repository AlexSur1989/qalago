import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/business_onboarding/utils/onboarding_labels.dart';
import 'package:qalago_mobile/features/business_onboarding/utils/onboarding_errors.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  final l10n = lookupAppLocalizations(const Locale('ru'));

  test('application status labels', () {
    expect(applicationStatusLabel(l10n, 'PENDING'), 'На проверке');
    expect(applicationStatusLabel(l10n, 'DRAFT'), 'Черновик');
  });

  test('claim status labels', () {
    expect(claimStatusLabel(l10n, 'APPROVED'), 'Одобрено');
  });

  test('membership role labels', () {
    expect(membershipRoleLabel(l10n, 'OWNER'), 'Владелец');
    expect(membershipRoleLabel(l10n, 'MANAGER'), 'Менеджер');
  });

  test('maps duplicate onboarding errors', () {
    expect(
      mapOnboardingError(l10n, 'duplicate business already exists'),
      contains('Похожий бизнес'),
    );
  });
}
