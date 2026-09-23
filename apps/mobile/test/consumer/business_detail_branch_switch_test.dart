import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_details_screen.dart';
import 'package:qalago_mobile/features/businesses/widgets/business_branches_section.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/business_branch_location.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

import '../support/l10n_test_harness.dart';

const _businessId = 'cmpn1wnq1000iult8yj6a06q7';
const _l1 = 'bl7085ee9a617ae8b64026db';
const _l2 = 'cmue301ys0001ulx8t3dkoyey';

final _branches = [
  const BusinessBranchLocation(
    id: _l1,
    businessId: _businessId,
    cityId: 'c1',
    citySlug: 'uralsk',
    cityNameRu: 'Уральск',
    cityNameKk: 'Орал',
    address: 'ул. Сейфуллина, 22, Уральск',
    isPrimary: true,
    latitude: 51.2298,
    longitude: 51.3925,
    phone: '+77112241004',
  ),
  const BusinessBranchLocation(
    id: _l2,
    businessId: _businessId,
    cityId: 'c1',
    citySlug: 'uralsk',
    cityNameRu: 'Уральск',
    cityNameKk: 'Орал',
    address: 'QA — проспект Абая 100, Уральск',
    isPrimary: false,
    latitude: 51.248,
    longitude: 51.365,
  ),
];

Map<String, dynamic> _detailForLocation(String? locationId) {
  final isL2 = locationId == _l2;
  return {
    'id': _businessId,
    'title': 'Bar Code 51',
    'activeLocationId': locationId ?? _l1,
    'effectivePhysical': {
      'locationId': locationId ?? _l1,
      'address': isL2
          ? 'QA — проспект Абая 100, Уральск'
          : 'ул. Сейфуллина, 22, Уральск',
      'latitude': isL2 ? 51.248 : 51.2298,
      'longitude': isL2 ? 51.365 : 51.3925,
      'workHours': isL2 ? {'mon': 'QA-L2 12:00-22:00'} : {'mon': '17:00-02:00'},
    },
    'effectiveCatalog': {
      'activeLocationId': locationId ?? _l1,
      'items': [
        {
          'id': isL2 ? 'qa-l2-item' : 'qa-l1-item',
          'title': isL2 ? 'QA ONLY L2 (a796)' : 'QA ONLY L1 (a796)',
        },
      ],
      'totalCount': 1,
      'sections': [],
    },
    'effectivePromotions': {
      'activeLocationId': locationId ?? _l1,
      'items': [
        {
          'id': isL2 ? 'qa-l2-promo' : 'qa-l1-promo',
          'title': isL2 ? 'QA PROMO L2 (a796)' : 'QA PROMO L1 (a796)',
          'status': 'ACTIVE',
        },
      ],
      'totalCount': 1,
    },
    'category': {'title': 'Бары'},
    'city': {
      'nameRu': 'Уральск',
      'nameKk': 'Орал',
      'timezone': 'Asia/Oral',
    },
    'reviewsPreview': {'items': [], 'totalCount': 0},
    'reviewCount': 0,
  };
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        nameKk: 'Орал',
        launchStatus: 'LIVE',
      );
}

class _RecordingCatalogRepository extends CatalogRepository {
  _RecordingCatalogRepository() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  final detailRequests = <BusinessDetailRequest>[];

  @override
  Future<Map<String, dynamic>> fetchBusinessDetails(
    String id, {
    String? locationId,
  }) async {
    detailRequests.add(
      BusinessDetailRequest(businessId: id, locationId: locationId),
    );
    return _detailForLocation(locationId);
  }

  @override
  Future<void> trackBusinessView(
    String businessId, {
    BusinessTrafficSource? trafficSource,
    String? searchQuery,
    AudienceDistanceBucket? audienceDistanceBucket,
    String? discoverySurface,
    String? businessLocationId,
    String? visitorId,
    String? sessionId,
  }) async {}
}

Future<void> _tapBranch(WidgetTester tester, String locationId) async {
  final finder = find.byKey(Key('business_branch_$locationId'));
  await tester.scrollUntilVisible(
    finder,
    120,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.tap(finder);
}

Future<void> _pumpDetailRouter(
  WidgetTester tester, {
  required GoRouter router,
  required _RecordingCatalogRepository repo,
  required List<BusinessBranchLocation> branches,
}) async {
  await tester.binding.setSurfaceSize(const Size(800, 1200));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        authProvider.overrideWith(() => _GuestAuthNotifier()),
        catalogRepositoryProvider.overrideWith((ref) => repo),
        businessPublicBranchesProvider.overrideWith((ref, id) async => branches),
        businessFavoriteProvider.overrideWith((ref, id) async => false),
        myBusinessesProvider.overrideWith((ref) async => const []),
        userLocationProvider.overrideWith((ref) => Stream.value(null)),
        analyticsSessionIdProvider.overrideWith((ref) => 'test-session-id'),
        analyticsVisitorIdProvider.overrideWith((ref) async => 'a' * 32),
      ],
      child: wrapRouterWithL10n(router),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}

GoRouter _detailRouter(String initialLocation) {
  return GoRouter(
    initialLocation: initialLocation,
    routes: [
      GoRoute(
        path: '/home',
        builder: (_, __) => const Scaffold(body: Text('Home')),
      ),
      GoRoute(
        path: '/business/:id',
        builder: (context, state) {
          final businessId = state.pathParameters['id']!;
          final locationId = parseSelectedLocationIdFromRoute(
            state.uri.queryParameters['locationId'],
          );
          return BusinessDetailsScreen(
            key: ValueKey('$businessId|${locationId ?? ''}'),
            id: businessId,
            trafficSource: parseBusinessTrafficSourceFromRoute(
              state.uri.queryParameters['source'],
            ),
            selectedLocationId: locationId,
          );
        },
      ),
    ],
  );
}

void main() {
  test('switchBusinessDetailBranch uses replace-friendly URI', () {
    final uri = businessDetailRouteUri(
      _businessId,
      BusinessTrafficSource.map,
      selectedLocationId: _l2,
    );
    expect(uri.path, '/business/$_businessId');
    expect(uri.queryParameters['locationId'], _l2);
    expect(uri.queryParameters['source'], BusinessTrafficSource.map.apiValue);
  });

  group('Business detail branch switching', () {
    testWidgets('multi-branch renders Филиалы and both addresses', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter(
        '/business/$_businessId?source=map&locationId=$_l1',
      );
      await _pumpDetailRouter(
        tester,
        router: router,
        repo: repo,
        branches: _branches,
      );

      expect(find.text('Филиалы'), findsOneWidget);
      expect(find.textContaining('Сейфуллина'), findsWidgets);
      expect(find.textContaining('Абая'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_rounded), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('switch L1 -> L2 keeps business id and refreshes detail', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter(
        '/business/$_businessId?source=map&locationId=$_l1',
      );
      await _pumpDetailRouter(
        tester,
        router: router,
        repo: repo,
        branches: _branches,
      );

      expect(find.textContaining('QA ONLY L1'), findsOneWidget);
      await _tapBranch(tester, _l2);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(router.routeInformationProvider.value.uri.queryParameters['locationId'], _l2);
      expect(repo.detailRequests.last.locationId, _l2);
      expect(find.textContaining('QA ONLY L2'), findsOneWidget);
      expect(find.textContaining('Абая 100'), findsWidgets);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('switch L2 -> L1', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter(
        '/business/$_businessId?source=map&locationId=$_l2',
      );
      await _pumpDetailRouter(
        tester,
        router: router,
        repo: repo,
        branches: _branches,
      );

      await _tapBranch(tester, _l1);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(router.routeInformationProvider.value.uri.queryParameters['locationId'], _l1);
      expect(repo.detailRequests.last.locationId, _l1);
      expect(find.textContaining('QA ONLY L1'), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('branch switch does not grow navigation stack', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = GoRouter(
        initialLocation: '/home',
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, _) => Scaffold(
              body: Center(
                child: FilledButton(
                  onPressed: () => context.push(
                    '/business/$_businessId?source=${BusinessTrafficSource.map.apiValue}&locationId=$_l1',
                  ),
                  child: const Text('Open detail'),
                ),
              ),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (context, state) {
              final businessId = state.pathParameters['id']!;
              final locationId = parseSelectedLocationIdFromRoute(
                state.uri.queryParameters['locationId'],
              );
              return BusinessDetailsScreen(
                key: ValueKey('$businessId|${locationId ?? ''}'),
                id: businessId,
                trafficSource: BusinessTrafficSource.map,
                selectedLocationId: locationId,
              );
            },
          ),
        ],
      );

      await tester.binding.setSurfaceSize(const Size(800, 1200));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            catalogRepositoryProvider.overrideWith((ref) => repo),
            businessPublicBranchesProvider.overrideWith((ref, id) async => _branches),
            businessFavoriteProvider.overrideWith((ref, id) async => false),
            myBusinessesProvider.overrideWith((ref) async => const []),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            analyticsSessionIdProvider.overrideWith((ref) => 'test-session-id'),
            analyticsVisitorIdProvider.overrideWith((ref) async => 'a' * 32),
          ],
          child: wrapRouterWithL10n(router),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      await tester.tap(find.text('Open detail'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      expect(router.canPop(), isTrue);

      await _tapBranch(tester, _l2);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(router.canPop(), isTrue);
      final detailUri = GoRouterState.of(
        tester.element(find.byType(BusinessDetailsScreen)),
      ).uri;
      expect(detailUri.queryParameters['locationId'], _l2);

      router.pop();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Open detail'), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('single branch hides Филиалы section', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter('/business/$_businessId?source=direct');
      await _pumpDetailRouter(
        tester,
        router: router,
        repo: repo,
        branches: [_branches.first],
      );

      expect(find.text('Филиалы'), findsNothing);
      expect(find.byType(BusinessBranchesSection), findsNothing);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('branch provider failure still shows detail content', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter(
        '/business/$_businessId?source=map&locationId=$_l2',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            catalogRepositoryProvider.overrideWith((ref) => repo),
            businessPublicBranchesProvider.overrideWith(
              (ref, id) async => throw Exception('network'),
            ),
            businessFavoriteProvider.overrideWith((ref, id) async => false),
            myBusinessesProvider.overrideWith((ref) async => const []),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            analyticsSessionIdProvider.overrideWith((ref) => 'test-session-id'),
            analyticsVisitorIdProvider.overrideWith((ref) async => 'a' * 32),
          ],
          child: wrapRouterWithL10n(router),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.text('Bar Code 51'), findsOneWidget);
      expect(find.textContaining('Абая'), findsWidgets);
      expect(find.text('Не удалось загрузить филиалы'), findsOneWidget);
      expect(find.text('Повторить'), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('favorites/reviews remain business-scoped on switch', (tester) async {
      final repo = _RecordingCatalogRepository();
      final router = _detailRouter(
        '/business/$_businessId?source=map&locationId=$_l1',
      );
      await _pumpDetailRouter(
        tester,
        router: router,
        repo: repo,
        branches: _branches,
      );

      expect(repo.detailRequests.last.businessId, _businessId);
      await _tapBranch(tester, _l2);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      expect(repo.detailRequests.last.businessId, _businessId);
      expect(find.text('Отзывы'), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });
  });
}
