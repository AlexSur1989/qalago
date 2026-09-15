import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/auth_prompt.dart';
import 'package:qalago_mobile/core/locale/hardcoded_ui_guard.dart';
import 'package:qalago_mobile/core/release/release_gate_screens.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Stage 6.10B.2 consumer localization', () {
    test('RU/KK lookupAppLocalizations sample keys', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      final kk = lookupAppLocalizations(const Locale('kk'));

      expect(ru.defaultSearchHint, 'Поиск...');
      expect(kk.defaultSearchHint, 'Іздеу...');

      expect(ru.mapLoadFailed, isNotEmpty);
      expect(kk.mapLoadFailed, isNotEmpty);

      expect(ru.businessProductsServices, 'Товары и услуги');
      expect(kk.businessProductsServices, isNotEmpty);

      expect(ru.promotionsTitle, 'Акции');
      expect(kk.promotionsTitle, isNotEmpty);

      expect(ru.notificationsTitle, 'Уведомления');
      expect(kk.notificationsTitle, isNotEmpty);

      expect(ru.profileHelp, 'Помощь');
      expect(kk.profileHelp, isNotEmpty);

      expect(ru.commonLogin, isNotEmpty);
      expect(kk.commonLogin, isNotEmpty);
    });

    test('hardcoded UI scanner passes expanded consumer roots', () {
      final violations = scanHardcodedConsumerUiStrings();
      expect(violations, isEmpty, reason: violations.join('\n'));
    });

    testWidgets('release gate uses localized retry', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('ru'),
          home: MaintenanceScreen(messageRu: 'Test', onRetry: () {}),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Повторить'), findsOneWidget);
    });

    testWidgets('auth prompt uses localized login action', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('ru'),
          home: Builder(
            builder: (context) => Scaffold(
              body: FilledButton(
                onPressed: () => showAuthRequiredDialog(
                  context,
                  title: 'Title',
                  message: 'Message',
                  returnPath: '/test',
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(find.text('Войти'), findsOneWidget);
    });
  });
}
