import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_coordinator.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_executor.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_locale.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_target.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/router/app_router.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

GoRouter _minimalRouter() {
  return GoRouter(
    routes: [
      GoRoute(path: '/home', builder: (_, __) => const SizedBox()),
    ],
    initialLocation: '/home',
  );
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Uralsk',
        nameKk: 'Oral',
        launchStatus: 'LIVE',
      );
}

class _StubCatalog extends CatalogRepository {
  _StubCatalog() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  @override
  Future<List<CategoryModel>> fetchCategories({String? citySlug}) async => [];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('KZ-C.1F deep-link locale authority', () {
    late ProviderContainer container;

    tearDown(() {
      container.dispose();
    });

    Future<void> bootstrap({required Map<String, Object> prefs}) async {
      SharedPreferences.setMockInitialValues(prefs);
      container = ProviderContainer(
        overrides: [
          appRouterProvider.overrideWithValue(_minimalRouter()),
          catalogRepositoryProvider.overrideWithValue(_StubCatalog()),
          authProvider.overrideWith(_GuestAuthNotifier.new),
          cityProvider.overrideWith(_UralskCityNotifier.new),
        ],
      );
      await container.read(onboardingProvider.future);
      await container.read(onboardingProvider.notifier).markCompleted();
      await container.read(appLocaleProvider.notifier).initialHydration;
    }

    test('CASE 1 saved RU + /kk/uralsk → KK UI and prefs', () async {
      await bootstrap(prefs: {kUiLocalePrefsKey: 'ru'});
      expect(container.read(appLocaleProvider).languageCode, 'ru');

      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/kk/uralsk'),
          );
      await Future<void>.delayed(Duration.zero);

      expect(container.read(appLocaleProvider).languageCode, 'kk');
      final stored = await SharedPreferences.getInstance();
      expect(stored.getString(kUiLocalePrefsKey), 'kk');
    });

    test('CASE 2 saved KK + /ru/uralsk → RU UI and prefs', () async {
      await bootstrap(prefs: {kUiLocalePrefsKey: 'kk'});
      expect(container.read(appLocaleProvider).languageCode, 'kk');

      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/ru/uralsk'),
          );
      await Future<void>.delayed(Duration.zero);

      expect(container.read(appLocaleProvider).languageCode, 'ru');
      final stored = await SharedPreferences.getInstance();
      expect(stored.getString(kUiLocalePrefsKey), 'ru');
    });

    test('CASE 4 no saved locale → startup KK', () async {
      await bootstrap(prefs: {});
      expect(container.read(appLocaleProvider).languageCode, 'kk');
      final stored = await SharedPreferences.getInstance();
      expect(stored.containsKey(kUiLocalePrefsKey), isFalse);
    });

    test('CASE 5 saved RU without deep link → startup RU', () async {
      await bootstrap(prefs: {kUiLocalePrefsKey: 'ru'});
      expect(container.read(appLocaleProvider).languageCode, 'ru');
    });

    test('warm path: hydrated RU then /kk/ via executor', () async {
      await bootstrap(prefs: {kUiLocalePrefsKey: 'ru'});
      await container.read(publicDeepLinkExecutorProvider).execute(
            const PublicDeepLinkCityHomeTarget(
              locale: PublicDeepLinkLocale.kk,
              citySlug: 'uralsk',
            ),
          );
      expect(container.read(appLocaleProvider).languageCode, 'kk');
    });
  });
}
