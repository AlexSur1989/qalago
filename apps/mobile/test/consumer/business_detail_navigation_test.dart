import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_catalog_screen.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_details_screen.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_promotions_screen.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/business_branch_location.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

import '../support/l10n_test_harness.dart';

const _businessId = 'biz-nav-test';
const _l1 = 'loc-l1-nav';
const _l2 = 'loc-l2-nav';

Map<String, dynamic> _detail({
  required int catalogTotal,
  required int promoTotal,
  String? locationId,
}) {
  final loc = locationId ?? _l1;
  return {
    'id': _businessId,
    'title': 'Nav Test Biz',
    'activeLocationId': loc,
    'effectivePhysical': {
      'locationId': loc,
      'address': loc == _l2 ? 'L2 address' : 'L1 address',
    },
    'effectiveCatalog': {
      'activeLocationId': loc,
      'items': [
        {'id': 'c1', 'title': 'Catalog item one'},
      ],
      'totalCount': catalogTotal,
      'sections': [],
    },
    'effectivePromotions': {
      'activeLocationId': loc,
      'items': [
        {
          'id': 'p1',
          'title': 'Promo one',
          'status': 'ACTIVE',
          'discountText': '-10%',
        },
      ],
      'totalCount': promoTotal,
    },
    'category': {'title': 'Food'},
    'city': {'nameRu': 'Uralsk', 'nameKk': 'Oral', 'timezone': 'Asia/Oral'},
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
        nameRu: 'Uralsk',
        nameKk: 'Oral',
        launchStatus: 'LIVE',
      );
}

class _NavCatalogRepository extends CatalogRepository {
  _NavCatalogRepository() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  int promotionViewCalls = 0;
  String? lastPromotionsLocationId;

  @override
  Future<Map<String, dynamic>> fetchBusinessDetails(
    String id, {
    String? locationId,
  }) async {
    return _detail(
      catalogTotal: 1,
      promoTotal: 1,
      locationId: locationId,
    );
  }

  @override
  Future<Map<String, dynamic>> fetchBusinessCatalog(
    String businessId, {
    int page = 1,
    int limit = 20,
    String? sectionId,
    String? search,
    String? locationId,
  }) async {
    return {
      'items': [
        {'id': 'c1', 'title': 'Catalog item one'},
      ],
      'sections': [],
      'pagination': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1},
    };
  }

  @override
  Future<Map<String, dynamic>> fetchBusinessPublicPromotions(
    String businessId, {
    int page = 1,
    int limit = 20,
    String? locationId,
  }) async {
    lastPromotionsLocationId = locationId;
    return {
      'items': [
        {
          'id': 'p1',
          'title': 'Promo one',
          'status': 'ACTIVE',
          'discountText': '-10%',
        },
      ],
      'pagination': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1},
    };
  }

  @override
  Future<void> trackPromotionView(
    String businessId, {
    String? promotionId,
    String? sessionId,
    String? visitorId,
  }) async {
    promotionViewCalls++;
  }

  @override
  Future<void> trackBusinessView(
    String businessId, {
    BusinessTrafficSource? trafficSource,
    String? searchQuery,
    AudienceDistanceBucket? audienceDistanceBucket,
    String? discoverySurface,
    String? visitorId,
    String? sessionId,
  }) async {}
}

final _singleBranch = [
  const BusinessBranchLocation(
    id: _l1,
    businessId: _businessId,
    cityId: 'c1',
    citySlug: 'uralsk',
    cityNameRu: 'Uralsk',
    cityNameKk: 'Oral',
    address: 'L1 address',
    isPrimary: true,
    latitude: 51.2,
    longitude: 51.3,
  ),
];

GoRouter _router(String initial) {
  return GoRouter(
    initialLocation: initial,
    routes: [
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
            selectedLocationId: locationId,
          );
        },
      ),
      GoRoute(
        path: '/business/:id/catalog',
        builder: (context, state) {
          final businessId = state.pathParameters['id']!;
          final locationId = parseSelectedLocationIdFromRoute(
            state.uri.queryParameters['locationId'],
          );
          return BusinessCatalogScreen(
            businessId: businessId,
            locationId: locationId,
          );
        },
      ),
      GoRoute(
        path: '/business/:id/promotions',
        builder: (context, state) {
          final businessId = state.pathParameters['id']!;
          final locationId = parseSelectedLocationIdFromRoute(
            state.uri.queryParameters['locationId'],
          );
          return BusinessPromotionsScreen(
            businessId: businessId,
            locationId: locationId,
          );
        },
      ),
    ],
  );
}

Future<void> _pump(
  WidgetTester tester,
  GoRouter router,
  _NavCatalogRepository repo,
) async {
  await tester.binding.setSurfaceSize(const Size(800, 1400));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        authProvider.overrideWith(() => _GuestAuthNotifier()),
        catalogRepositoryProvider.overrideWith((ref) => repo),
        businessPublicBranchesProvider.overrideWith((ref, id) async => _singleBranch),
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

void main() {
  group('Business detail catalog/promotions navigation', () {
    testWidgets('A — catalog navigation when preview equals total', (tester) async {
      final repo = _NavCatalogRepository();
      final router = _router('/business/$_businessId?locationId=$_l1');
      await _pump(tester, router, repo);

      final catalogAction = find.textContaining('Смотреть все');
      expect(catalogAction, findsOneWidget);
      await tester.scrollUntilVisible(
        catalogAction,
        120,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(catalogAction);
      await tester.pumpAndSettle();

      expect(find.byType(BusinessCatalogScreen), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('E/F — promotions navigation to business promotions L1', (tester) async {
      final repo = _NavCatalogRepository();
      final router = _router('/business/$_businessId?locationId=$_l1');
      await _pump(tester, router, repo);

      final promoAction = find.textContaining('Все акции');
      expect(promoAction, findsOneWidget);
      await tester.scrollUntilVisible(
        promoAction,
        120,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(promoAction);
      await tester.pumpAndSettle();

      expect(find.byType(BusinessPromotionsScreen), findsOneWidget);
      expect(repo.lastPromotionsLocationId, _l1);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('Q — promotion tile opens list and tracks view', (tester) async {
      final repo = _NavCatalogRepository();
      final router = _router('/business/$_businessId?locationId=$_l1');
      await _pump(tester, router, repo);

      await tester.tap(find.text('Promo one'));
      await tester.pumpAndSettle();

      expect(repo.promotionViewCalls, 1);
      expect(find.byType(BusinessPromotionsScreen), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });

    testWidgets('D/H — empty catalog and promotions hide section actions', (tester) async {
      final emptyRepo = _EmptyDetailRepository();
      final router = _router('/business/$_businessId?locationId=$_l1');
      await _pump(tester, router, emptyRepo);

      expect(find.textContaining('Смотреть все'), findsNothing);
      expect(find.textContaining('Все акции'), findsNothing);
      expect(find.text('Товары и услуги'), findsNothing);
      expect(find.text('Акции'), findsNothing);

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });
  });
}

class _EmptyDetailRepository extends _NavCatalogRepository {
  @override
  Future<Map<String, dynamic>> fetchBusinessDetails(
    String id, {
    String? locationId,
  }) async {
    return {
      'id': _businessId,
      'title': 'Empty',
      'activeLocationId': locationId ?? _l1,
      'effectivePhysical': {
        'locationId': locationId ?? _l1,
        'address': 'addr',
      },
      'effectiveCatalog': {
        'activeLocationId': locationId ?? _l1,
        'items': [],
        'totalCount': 0,
        'sections': [],
      },
      'effectivePromotions': {
        'activeLocationId': locationId ?? _l1,
        'items': [],
        'totalCount': 0,
      },
      'category': {'title': 'Food'},
      'city': {'nameRu': 'Uralsk', 'nameKk': 'Oral', 'timezone': 'Asia/Oral'},
      'reviewsPreview': {'items': [], 'totalCount': 0},
      'reviewCount': 0,
    };
  }
}
