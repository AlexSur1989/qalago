import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:qalago_mobile/core/deep_links/deep_link_session_city.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_coordinator.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_executor.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_parse_result.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_parser.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_target.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/router/app_router.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';

GoRouter _testGoRouter() {
  return GoRouter(
    routes: [
      GoRoute(path: '/home', builder: (_, __) => const SizedBox()),
    ],
    initialLocation: '/home',
  );
}

List<Override> _deepLinkTestOverrides({GoRouter? router}) {
  return [
    appRouterProvider.overrideWithValue(router ?? _testGoRouter()),
    authProvider.overrideWith(_GuestAuthNotifier.new),
    cityProvider.overrideWith(_UralskCityNotifier.new),
  ];
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PublicDeepLinkCoordinator', () {
    late ProviderContainer container;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      container = ProviderContainer(overrides: _deepLinkTestOverrides());
      await container.read(onboardingProvider.future);
    });

    tearDown(() {
      container.dispose();
    });

    test('invalid host does not set pending target', () {
      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://evil.example/ru/uralsk'),
          );
      expect(container.read(pendingPublicDeepLinkTargetProvider), isNull);
    });

    test('valid target pending while onboarding required', () {
      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/kk/aktobe'),
          );
      final pending = container.read(pendingPublicDeepLinkTargetProvider);
      expect(pending, isA<PublicDeepLinkCityHomeTarget>());
      expect((pending as PublicDeepLinkCityHomeTarget).citySlug, 'aktobe');
    });

    test('pending retained until navigation can execute', () async {
      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/kk/aktobe'),
          );
      await container.read(onboardingProvider.notifier).markCompleted();
      await container.read(publicDeepLinkCoordinatorProvider).tryExecutePending();
      // Session city applies even when router is unavailable in unit tests.
      expect(container.read(deepLinkSessionCitySlugProvider), 'aktobe');
    });

    test('invalid link does not change locale', () {
      container.read(appLocaleProvider.notifier).setLocale(const Locale('ru'));
      container.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/en/uralsk'),
          );
      expect(container.read(appLocaleProvider).languageCode, 'ru');
    });

    test('duplicate warm delivery does not double-execute', () async {
      final executeCount = [0];
      final dedupeContainer = ProviderContainer(
        overrides: [
          ..._deepLinkTestOverrides(),
          publicDeepLinkExecutorProvider.overrideWith(
            (ref) => _CountingExecutor(ref, executeCount),
          ),
        ],
      );
      addTearDown(dedupeContainer.dispose);
      await dedupeContainer.read(onboardingProvider.future);
      await dedupeContainer.read(onboardingProvider.notifier).markCompleted();
      final coordinator = dedupeContainer.read(publicDeepLinkCoordinatorProvider);
      coordinator.handleIncomingUri(Uri.parse('https://qalago.kz/kk/uralsk'));
      await Future<void>.delayed(Duration.zero);
      coordinator.handleIncomingUri(Uri.parse('https://qalago.kz/kk/uralsk'));
      await Future<void>.delayed(Duration.zero);
      expect(executeCount[0], 1);
    });

    test('pending cleared after successful execute', () async {
      final executeContainer = ProviderContainer(
        overrides: _deepLinkTestOverrides(),
      );
      addTearDown(executeContainer.dispose);
      await executeContainer.read(onboardingProvider.future);
      executeContainer.read(publicDeepLinkCoordinatorProvider).handleIncomingUri(
            Uri.parse('https://qalago.kz/kk/aktobe'),
          );
      expect(
        executeContainer.read(pendingPublicDeepLinkTargetProvider),
        isNotNull,
      );
      await executeContainer.read(onboardingProvider.notifier).markCompleted();
      await executeContainer.read(publicDeepLinkCoordinatorProvider).tryExecutePending();
      expect(executeContainer.read(pendingPublicDeepLinkTargetProvider), isNull);
    });
  });

  group('discovery city session vs persisted city', () {
    test('session city overrides discovery slug without persisting city', () {
      SharedPreferences.setMockInitialValues({'selected_city_slug': 'uralsk'});
      final container = ProviderContainer(overrides: _deepLinkTestOverrides());
      addTearDown(container.dispose);
      container
          .read(deepLinkSessionCitySlugProvider.notifier)
          .setSessionCitySlug('aktobe');
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(discoveryCitySlugProvider), 'aktobe');
    });
  });

  group('parsePublicDeepLink regression', () {
    test('business locationId preserved in target', () {
      const loc = 'bl7085ee9a617ae8b64026db';
      final result = parsePublicDeepLink(
        Uri.parse(
          'https://qalago.kz/ru/aktobe/business/foo?locationId=$loc',
        ),
      );
      expect(result, isA<PublicDeepLinkParsed>());
      final target = (result as PublicDeepLinkParsed).target
          as PublicDeepLinkBusinessTarget;
      expect(target.citySlug, 'aktobe');
      expect(target.locationId, loc);
    });
  });
}

class _CountingExecutor extends PublicDeepLinkExecutor {
  _CountingExecutor(super.ref, this.counter);

  final List<int> counter;

  @override
  Future<bool> execute(PublicDeepLinkTarget target) async {
    counter[0]++;
    return super.execute(target);
  }
}
