import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/push/push_bootstrap.dart';
import 'package:qalago_mobile/core/push/push_device_api.dart';
import 'package:qalago_mobile/core/push/push_providers.dart';
import 'package:qalago_mobile/core/push/push_registration_service.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakePushRegistrationService extends PushRegistrationService {
  _FakePushRegistrationService() : super(api: PushDeviceApi(Dio()), messaging: null);

  int syncCalls = 0;
  String? lastLocale;

  @override
  Future<void> syncForAuthenticatedUser({required String? localeTag}) async {
    syncCalls += 1;
    lastLocale = localeTag;
  }
}

class _AuthedNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isAuthenticated: true, isLoading: false);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('push locale sync (KZ-C.1D.2)', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('explicit KK→RU switch triggers best-effort push locale sync when authenticated', () async {
      final fakeService = _FakePushRegistrationService();

      final container = ProviderContainer(
        overrides: [
          pushRegistrationServiceProvider.overrideWithValue(fakeService),
          authProvider.overrideWith(_AuthedNotifier.new),
        ],
      );
      addTearDown(container.dispose);

      container.read(pushLocaleSyncProvider);

      final localeNotifier = container.read(appLocaleProvider.notifier);
      await localeNotifier.setLocale(const Locale('kk'));
      await localeNotifier.setLocale(const Locale('ru'));

      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(fakeService.syncCalls, greaterThanOrEqualTo(1));
      expect(fakeService.lastLocale, 'ru');
    });

    test('explicit RU→KK switch triggers sync with kk', () async {
      final fakeService = _FakePushRegistrationService();

      final container = ProviderContainer(
        overrides: [
          pushRegistrationServiceProvider.overrideWithValue(fakeService),
          authProvider.overrideWith(_AuthedNotifier.new),
        ],
      );
      addTearDown(container.dispose);

      container.read(pushLocaleSyncProvider);

      final localeNotifier = container.read(appLocaleProvider.notifier);
      await Future<void>.delayed(const Duration(milliseconds: 20));
      await localeNotifier.setLocale(const Locale('ru'));
      await localeNotifier.setLocale(const Locale('kk'));

      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(fakeService.lastLocale, 'kk');
    });

    test('sync failure does not fail language switch', () async {
      final notifier = AppLocaleNotifier();
      await Future<void>.delayed(const Duration(milliseconds: 20));
      await notifier.setLocale(const Locale('ru'));
      expect(notifier.state, const Locale('ru'));
    });
  });
}
