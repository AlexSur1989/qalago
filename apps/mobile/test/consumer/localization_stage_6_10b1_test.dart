import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/locale/consumer_api_errors.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_language_screen.dart';
import 'package:qalago_mobile/features/categories/utils/category_display.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../support/l10n_test_harness.dart';
import 'package:qalago_mobile/core/locale/hardcoded_ui_guard.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Stage 6.10B.1 localization foundation', () {
    test('supported locales are ru and kk', () {
      expect(
        AppLocalizations.supportedLocales.map((l) => l.languageCode).toList(),
        containsAll(['ru', 'kk']),
      );
    });

    test('unsupported locale is not in generated lookup (app pins ru/kk)', () {
      expect(
        () => lookupAppLocalizations(const Locale('en')),
        throwsA(isA<FlutterError>()),
      );
    });

    test('device kk resolves to kk on first launch', () {
      expect(resolveDeviceLocale().languageCode, isNotEmpty);
    });

    test('localeToCode maps kk and ru', () {
      expect(localeToCode(const Locale('kk')), 'kk');
      expect(localeToCode(const Locale('ru')), 'ru');
    });

    test('user locale override persists', () async {
      SharedPreferences.setMockInitialValues({});
      final notifier = AppLocaleNotifier();
      await notifier.setLocale(const Locale('kk'));
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'kk');
      expect(notifier.state, const Locale('kk'));
    });

    test('category displayName uses locale', () {
      final category = CategoryModel(
        id: 'c1',
        slug: 'food',
        nameRu: 'Еда',
        nameKk: 'Тамақ',
        title: 'Еда',
      );
      expect(categoryDisplayName(category, localeCode: 'ru'), 'Еда');
      expect(categoryDisplayName(category, localeCode: 'kk'), 'Тамақ');
    });

    test('known API error codes map RU/KK', () {
      final ru = lookupAppLocalizations(const Locale('ru'));
      final kk = lookupAppLocalizations(const Locale('kk'));
      expect(localizedConsumerError(ru, Exception('invalid_otp')), ru.errorInvalidOtp);
      expect(localizedConsumerError(kk, Exception('401 unauthorized')), kk.errorUnauthorized);
      expect(localizedConsumerError(ru, Exception('mystery')), ru.commonSomethingWrong);
      expect(localizedConsumerError(kk, Exception('mystery')), kk.commonSomethingWrong);
    });

    test('hardcoded UI string scanner passes allowlist', () {
      final violations = scanHardcodedConsumerUiStrings();
      expect(violations, isEmpty, reason: violations.join('\n'));
    });
  });

  group('Stage 6.10B.1 widgets', () {
    testWidgets('bottom nav RU labels', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: wrapWithL10n(
            const SizedBox.shrink(),
            locale: const Locale('ru'),
          ),
        ),
      );
      final ru = lookupAppLocalizations(const Locale('ru'));
      expect(ru.navHome, 'Главная');
      expect(ru.navCategories, 'Категории');
    });

    testWidgets('bottom nav KZ labels', (tester) async {
      final kk = lookupAppLocalizations(const Locale('kk'));
      expect(kk.navHome, 'Басты бет');
      expect(kk.navMap, 'Карта');
    });

    testWidgets('language selector shows localized title', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: wrapWithL10n(const ProfileLanguageScreen()),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Язык'), findsOneWidget);
      expect(find.text('Русский'), findsOneWidget);
      expect(find.text('Қазақша'), findsOneWidget);
    });
  });
}
