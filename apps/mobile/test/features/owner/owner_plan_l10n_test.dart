import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_plan_ui.dart';
import 'package:qalago_mobile/features/owner/utils/owner_l10n.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  test('RU plan payment status labels', () {
    final l10n = AppLocalizationsRu();
    expect(ownerPlanPaymentStatusLabel(l10n, 'PENDING'), isNotEmpty);
    expect(ownerPlanPaymentStatusLabel(l10n, 'COMPLETED'), isNotEmpty);
    expect(ownerPlanPaymentStatusLabel(l10n, 'CANCELLED'), isNotEmpty);
    expect(ownerPlanPaymentStatusLabel(l10n, 'FAILED'), isNotEmpty);
    expect(ownerPlanPaymentStatusLabel(l10n, 'PENDING'), isNot('PENDING'));
  });

  test('KK plan payment status labels', () {
    final l10n = AppLocalizationsKk();
    expect(ownerPlanPaymentStatusLabel(l10n, 'PENDING'), isNotEmpty);
    expect(l10n.ownerPlanPendingPaymentTitle, isNotEmpty);
    expect(l10n.ownerPlanSameTierRenewalHint, contains('күн'));
  });

  test('renew action label not reset-from-today copy', () {
    final l10n = AppLocalizationsRu();
    expect(
      ownerPlanPurchaseActionLabel(l10n, PlanPurchaseActionKind.renew),
      'Продлить',
    );
    expect(l10n.ownerPlanSameTierRenewalHint.toLowerCase(), isNot(contains('сегодня')));
  });
}
