import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> waitForLocaleLoad(AppLocaleNotifier notifier) async {
  await notifier.initialHydration;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('parseExplicitUiLocalePreference', () {
    test('kk and ru', () {
      expect(parseExplicitUiLocalePreference('kk'), const Locale('kk'));
      expect(parseExplicitUiLocalePreference('ru'), const Locale('ru'));
    });

    test('absent and invalid → null', () {
      expect(parseExplicitUiLocalePreference(null), isNull);
      expect(parseExplicitUiLocalePreference(''), isNull);
      expect(parseExplicitUiLocalePreference('en'), isNull);
      expect(parseExplicitUiLocalePreference('nope'), isNull);
    });
  });

  group('AppLocaleNotifier KZ-C.1B matrix', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
    });

    test('A fresh / no pref → KK, key not written', () async {
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      expect(notifier.state, kQalagoProductDefaultLocale);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.containsKey(kUiLocalePrefsKey), isFalse);
    });

    test('B saved kk → KK', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'kk'});
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      expect(notifier.state, const Locale('kk'));
    });

    test('C saved ru → RU', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'ru'});
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      expect(notifier.state, const Locale('ru'));
    });

    test('I invalid saved → KK', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'invalid'});
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      expect(notifier.state, kQalagoProductDefaultLocale);
    });

    test('explicit setLocale(kk) persists kk', () async {
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      await notifier.setLocale(const Locale('kk'));
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'kk');
      expect(notifier.state, const Locale('kk'));
    });

    test('explicit setLocale(ru) persists ru', () async {
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      await notifier.setLocale(const Locale('ru'));
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'ru');
      expect(notifier.state, const Locale('ru'));
    });

    test('recreate notifier with saved RU → RU', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'ru'});
      final n1 = AppLocaleNotifier();
      await waitForLocaleLoad(n1);
      expect(n1.state, const Locale('ru'));

      final n2 = AppLocaleNotifier();
      await waitForLocaleLoad(n2);
      expect(n2.state, const Locale('ru'));
    });

    test('recreate notifier with saved KK → KK', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'kk'});
      final n2 = AppLocaleNotifier();
      await waitForLocaleLoad(n2);
      expect(n2.state, const Locale('kk'));
    });

    test('explicit setLocale during hydration wins over saved RU (KZ-C.1F race)', () async {
      SharedPreferences.setMockInitialValues({kUiLocalePrefsKey: 'ru'});
      final notifier = AppLocaleNotifier();
      await notifier.setLocale(const Locale('kk'));
      await notifier.initialHydration;
      expect(notifier.state, const Locale('kk'));
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'kk');
    });

    test('device language does not affect initial state (no pref → KK)', () async {
      // Platform locale is whatever the test host uses; product default must win.
      final notifier = AppLocaleNotifier();
      await waitForLocaleLoad(notifier);
      expect(notifier.state, kQalagoProductDefaultLocale);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), isNull);
    });
  });
}
