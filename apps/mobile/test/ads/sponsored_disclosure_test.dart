import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/utils/consumer_sponsored_disclosure.dart';
import 'package:qalago_mobile/features/ads/widgets/sponsored_label.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/widgets/business_card.dart';

import '../support/l10n_test_harness.dart';

BusinessModel _sampleBusiness() {
  return BusinessModel(
    id: 'biz-1',
    title: 'Test Cafe',
    slug: 'test-cafe',
    address: 'Uralsk',
  );
}

void main() {
  group('consumer sponsored disclosure (6.13M.8)', () {
    test('RU commonAd is Реклама', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      expect(ru.commonAd, 'Реклама');
      expect(consumerSponsoredDisclosure(ru), 'Реклама');
    });

    test('KK commonAd is Жарнама', () {
      final kk = lookupAppLocalizations(const Locale('kk'));
      expect(kk.commonAd, 'Жарнама');
      expect(consumerSponsoredDisclosure(kk), 'Жарнама');
    });

    testWidgets('SponsoredLabel uses locale not backend displayLabel', (
      tester,
    ) async {
      await tester.pumpWidget(
        wrapWithL10n(
          const SponsoredLabel(),
          locale: const Locale('kk'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Жарнама'), findsOneWidget);
      expect(find.text('Реклама'), findsNothing);
      expect(find.text('Продвигается'), findsNothing);
    });

    testWidgets('sponsored BusinessCard shows localized disclosure', (
      tester,
    ) async {
      await tester.pumpWidget(
        wrapWithL10n(
          BusinessCard(
            business: _sampleBusiness(),
            sponsored: true,
            sponsoredLabel: 'Реклама',
          ),
          locale: const Locale('kk'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Жарнама'), findsOneWidget);
    });

    testWidgets('organic BusinessCard has no ad marker', (tester) async {
      await tester.pumpWidget(
        wrapWithL10n(
          BusinessCard(
            business: _sampleBusiness(),
            sponsored: false,
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(SponsoredLabel), findsNothing);
    });
  });
}
