import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:qalago_mobile/core/deep_links/deep_link_session_city.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_coordinator.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_executor.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_locale.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_target.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/router/app_router.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/models.dart';

/// F.6 Phase 6 — session city lifecycle closure QA (documented semantics).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('F.6 Phase 6 session city lifecycle', () {
    late ProviderContainer container;

    setUp(() async {
      SharedPreferences.setMockInitialValues({'selected_city_slug': 'uralsk'});
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
    });

    tearDown(() => container.dispose());

    Future<void> openAktobeHome() async {
      await container.read(publicDeepLinkExecutorProvider).execute(
            const PublicDeepLinkCityHomeTarget(
              locale: PublicDeepLinkLocale.ru,
              citySlug: 'aktobe',
            ),
          );
    }

    test('Aktobe link: target city session, persisted Uralsk, discovery Aktobe', () async {
      await openAktobeHome();
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(deepLinkSessionCitySlugProvider), 'aktobe');
      expect(container.read(discoveryCitySlugProvider), 'aktobe');
    });

    test('A — navigation within session keeps Aktobe discovery context', () async {
      await openAktobeHome();
      await container.read(publicDeepLinkExecutorProvider).execute(
            const PublicDeepLinkCategoriesTarget(
              locale: PublicDeepLinkLocale.ru,
              citySlug: 'aktobe',
            ),
          );
      expect(container.read(deepLinkSessionCitySlugProvider), 'aktobe');
      expect(container.read(discoveryCitySlugProvider), 'aktobe');
      expect(container.read(cityProvider).slug, 'uralsk');
    });

    test('B — explicit Uralsk picker path clears session and restores discovery', () async {
      await openAktobeHome();
      await container.read(cityProvider.notifier).selectCityFromApi({
        'slug': 'uralsk',
        'nameRu': 'Uralsk',
        'nameKk': 'Oral',
        'launchStatus': 'LIVE',
        'centerLat': 51.2,
        'centerLng': 51.4,
      });
      container.read(deepLinkSessionCitySlugProvider.notifier).clearSessionCitySlug();
      expect(container.read(deepLinkSessionCitySlugProvider), isNull);
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(discoveryCitySlugProvider), 'uralsk');
    });

    test('C — explicit other city clears session and persists chosen city', () async {
      await openAktobeHome();
      await container.read(cityProvider.notifier).selectCityFromApi({
        'slug': 'astana',
        'nameRu': 'Astana',
        'nameKk': 'Astana',
        'launchStatus': 'LIVE',
        'centerLat': 51.1,
        'centerLng': 71.4,
      });
      container.read(deepLinkSessionCitySlugProvider.notifier).clearSessionCitySlug();
      expect(container.read(deepLinkSessionCitySlugProvider), isNull);
      expect(container.read(cityProvider).slug, 'astana');
      expect(container.read(discoveryCitySlugProvider), 'astana');
    });

    test('D — second deep link updates session without changing persisted city', () async {
      await openAktobeHome();
      await container.read(publicDeepLinkExecutorProvider).execute(
            const PublicDeepLinkCityHomeTarget(
              locale: PublicDeepLinkLocale.kk,
              citySlug: 'astana',
            ),
          );
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(deepLinkSessionCitySlugProvider), 'astana');
      expect(container.read(discoveryCitySlugProvider), 'astana');
    });
  });

  group('F.6 Phase 6 failed pending target (6A edge)', () {
    test('failed cold-start flush keeps pending; no background re-execution loop', () async {
      SharedPreferences.setMockInitialValues({});
      var executeCalls = 0;
      final container = ProviderContainer(
        overrides: [
          appRouterProvider.overrideWithValue(_minimalRouter()),
          catalogRepositoryProvider.overrideWithValue(_FailingBusinessCatalog()),
          authProvider.overrideWith(_GuestAuthNotifier.new),
          cityProvider.overrideWith(_UralskCityNotifier.new),
          publicDeepLinkExecutorProvider.overrideWith(
            (ref) => _CountingExecutor(ref, () => executeCalls++),
          ),
        ],
      );
      addTearDown(container.dispose);
      await container.read(onboardingProvider.future);

      final coordinator = container.read(publicDeepLinkCoordinatorProvider);
      coordinator.handleIncomingUri(
        Uri.parse('https://qalago.kz/ru/aktobe/business/missing'),
      );
      expect(container.read(pendingPublicDeepLinkTargetProvider), isNotNull);

      await container.read(onboardingProvider.notifier).markCompleted();
      await coordinator.tryExecutePending();
      expect(executeCalls, 1);
      expect(container.read(pendingPublicDeepLinkTargetProvider), isNotNull);

      await Future<void>.delayed(const Duration(milliseconds: 100));
      expect(executeCalls, 1);

      await coordinator.tryExecutePending();
      expect(executeCalls, 2);
    });
  });
}

GoRouter _minimalRouter() {
  return GoRouter(
    initialLocation: '/home',
    routes: [
      GoRoute(path: '/home', builder: (_, __) => const SizedBox()),
      GoRoute(path: '/categories', builder: (_, __) => const SizedBox()),
    ],
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

class _StubCatalog implements CatalogRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FailingBusinessCatalog implements CatalogRepository {
  @override
  Future<Map<String, dynamic>> fetchBusinessBySlug({
    required String businessSlug,
    required String citySlug,
    String? locationId,
  }) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/businesses/by-slug/$businessSlug'),
      response: Response(
        requestOptions: RequestOptions(path: '/'),
        statusCode: 404,
      ),
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _CountingExecutor extends PublicDeepLinkExecutor {
  _CountingExecutor(super.ref, this.onExecute);

  final void Function() onExecute;

  @override
  Future<bool> execute(PublicDeepLinkTarget target) async {
    onExecute();
    return super.execute(target);
  }
}
