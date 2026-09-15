import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/hardcoded_ui_guard.dart';
import 'package:qalago_mobile/features/owner/utils/owner_l10n.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Stage 6.10B.3 owner localization', () {
    test('plan tier labels RU/KK and internal enums unchanged', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      final kk = lookupAppLocalizations(const Locale('kk'));

      expect(ownerPlanTierLabel(ru, 'FREE'), 'Бесплатный');
      expect(ownerPlanTierLabel(kk, 'FREE'), isNotEmpty);
      expect(ownerPlanTierLabel(ru, 'BASIC'), 'Бизнес');
      expect(ownerPlanTierLabel(ru, 'PREMIUM'), 'PRO');
      expect(ownerPlanTierLabel(ru, 'VIP'), 'VIP');

      expect(BusinessModel.normalizePlanTier('FREE'), 'FREE');
      expect(BusinessModel.normalizePlanTier('BASIC'), 'BASIC');
    });

    test('status and monetization enums map RU/KK', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      final kk = lookupAppLocalizations(const Locale('kk'));

      expect(ownerBusinessStatusLabel(ru, 'ACTIVE'), 'Активен');
      expect(ownerBusinessStatusLabel(kk, 'ACTIVE'), isNotEmpty);
      expect(monetizationOrderStatusLabel(ru, 'PAID'), 'Оплачен');
      expect(monetizationCampaignStatusLabel(ru, 'SCHEDULED'), isNotEmpty);
      expect(membershipRoleLabel(ru, 'OWNER'), ru.onboardingRoleOwner);
      expect(membershipRoleLabel(ru, 'MANAGER'), ru.onboardingRoleManager);
    });

    test('unknown status falls back safely', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      expect(ownerBusinessStatusLabel(ru, 'MYSTERY'), 'MYSTERY');
    });

    test('hardcoded scanner passes consumer + owner scope', () {
      expect(scanHardcodedConsumerUiStrings(), isEmpty);
    });

    test('dynamic business content keys not in plan labels', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      expect(ru.ownerDashboardTitle, isNot(contains('Test Business')));
    });
  });
}
