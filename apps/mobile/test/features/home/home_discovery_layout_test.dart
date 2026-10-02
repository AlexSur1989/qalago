import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/deep_links/deep_link_session_city.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/data/home_section_type.dart';
import 'package:qalago_mobile/features/home/presentation/home_screen.dart';
import 'package:qalago_mobile/features/home/providers/home_discovery_layout_provider.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/data/ad_placement_codes.dart';

import '../../support/l10n_test_harness.dart';

AdItemModel _vipAd() => AdItemModel(
      campaignId: 'vip-camp',
      placementId: 'pl-vip',
      placementCode: AdPlacementCodes.homeVipBanner,
      position: 1,
      sponsored: true,
      displayLabel: 'Реклама',
      creative: const AdCreativeModel(
        id: 'cr-1',
        title: 'VIP Business',
        description: 'Special offer',
        targetType: 'BUSINESS',
        targetId: 'biz-vip',
      ),
      business: const {'id': 'biz-vip', 'title': 'VIP Biz'},
    );

CategoryModel _cat(int i) => CategoryModel(
      id: 'c$i',
      title: 'Category $i',
      nameRu: 'Category $i',
      nameKk: 'Sanat $i',
      slug: 'c$i',
    );

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}

class _AktobeCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'aktobe',
        nameRu: 'Актобе',
        centerLat: 50.28,
        centerLng: 57.17,
      );
}

double _top(WidgetTester tester, Key key) =>
    tester.getTopLeft(find.byKey(key)).dy;

Future<void> _pumpWithLayout(
  WidgetTester tester,
  List<HomeSectionType> layout, {
  String citySlug = 'uralsk',
}) async {
  final cats = List.generate(9, _cat);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        discoveryCitySlugProvider.overrideWith((ref) => citySlug),
        appLocaleCodeProvider.overrideWith((ref) => 'ru'),
        homeDiscoveryLayoutProvider.overrideWith((ref) async => layout),
        cityCatalogTotalProvider.overrideWith((ref) async => 20),
        categoriesProvider.overrideWith((ref) async => cats),
        promotionsProvider.overrideWith(
          (ref) async => PaginatedPromotions(items: const []),
        ),
        homeOrganicRecommendationsProvider.overrideWith((ref) async => const []),
        businessesProvider.overrideWith(
          (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
        ),
        unreadNotificationsProvider.overrideWith((ref) async => 0),
        userLocationProvider.overrideWith((ref) => Stream.value(null)),
        homeVipBannerAdsProvider.overrideWith((ref) async => [_vipAd()]),
        homeFeaturedAdsProvider.overrideWith((ref) async => const []),
        homePromotionsAdsProvider.overrideWith((ref) async => const []),
      ],
      child: wrapWithL10n(const HomeScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('renders discovery sections in API order', (tester) async {
    await _pumpWithLayout(
      tester,
      [
        HomeSectionType.homePopular,
        HomeSectionType.categories,
        HomeSectionType.nearby,
      ],
    );
    expect(_top(tester, const Key('home_section_popular')),
        lessThan(_top(tester, const Key('home_section_categories'))));
    expect(_top(tester, const Key('home_section_categories')),
        lessThan(_top(tester, const Key('home_section_nearby'))));
    expect(find.byKey(const Key('home_section_featured')), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('disabled sections are omitted', (tester) async {
    await _pumpWithLayout(
      tester,
      [HomeSectionType.categories, HomeSectionType.nearby],
    );
    expect(find.byKey(const Key('home_section_categories')), findsOneWidget);
    expect(find.byKey(const Key('home_section_nearby')), findsOneWidget);
    expect(find.byKey(const Key('home_section_popular')), findsNothing);
    expect(find.byKey(const Key('home_section_featured')), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('API failure uses fallback layout', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          appLocaleCodeProvider.overrideWith((ref) => 'ru'),
          homeDiscoveryLayoutProvider.overrideWith(
            (ref) async => throw Exception('network'),
          ),
          cityCatalogTotalProvider.overrideWith((ref) async => 20),
          categoriesProvider.overrideWith((ref) async => List.generate(9, _cat)),
          promotionsProvider.overrideWith(
            (ref) async => PaginatedPromotions(items: const []),
          ),
          homeOrganicRecommendationsProvider.overrideWith((ref) async => const []),
          businessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
          ),
          unreadNotificationsProvider.overrideWith((ref) async => 0),
          userLocationProvider.overrideWith((ref) => Stream.value(null)),
          homeVipBannerAdsProvider.overrideWith((ref) async => [_vipAd()]),
          homeFeaturedAdsProvider.overrideWith((ref) async => const []),
          homePromotionsAdsProvider.overrideWith((ref) async => const []),
        ],
        child: wrapWithL10n(const HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('home_section_categories')), findsOneWidget);
    expect(find.byKey(const Key('home_section_popular')), findsOneWidget);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('city slug change uses new layout provider family', (tester) async {
    final layoutByCity = <String, List<HomeSectionType>>{
      'uralsk': [HomeSectionType.homePopular, HomeSectionType.categories],
      'aktobe': [HomeSectionType.categories, HomeSectionType.homePopular],
    };
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          discoveryCitySlugProvider.overrideWith((ref) => ref.watch(cityProvider).slug),
          appLocaleCodeProvider.overrideWith((ref) => 'ru'),
          homeDiscoveryLayoutProvider.overrideWith((ref) async {
            final slug = ref.watch(discoveryCitySlugProvider);
            return layoutByCity[slug]!;
          }),
          cityCatalogTotalProvider.overrideWith((ref) async => 20),
          categoriesProvider.overrideWith((ref) async => List.generate(9, _cat)),
          promotionsProvider.overrideWith(
            (ref) async => PaginatedPromotions(items: const []),
          ),
          homeOrganicRecommendationsProvider.overrideWith((ref) async => const []),
          businessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
          ),
          unreadNotificationsProvider.overrideWith((ref) async => 0),
          userLocationProvider.overrideWith((ref) => Stream.value(null)),
          homeVipBannerAdsProvider.overrideWith((ref) async => [_vipAd()]),
          homeFeaturedAdsProvider.overrideWith((ref) async => const []),
          homePromotionsAdsProvider.overrideWith((ref) async => const []),
        ],
        child: wrapWithL10n(const HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(_top(tester, const Key('home_section_popular')),
        lessThan(_top(tester, const Key('home_section_categories'))));

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _AktobeCityNotifier()),
          discoveryCitySlugProvider.overrideWith((ref) => ref.watch(cityProvider).slug),
          appLocaleCodeProvider.overrideWith((ref) => 'ru'),
          homeDiscoveryLayoutProvider.overrideWith((ref) async {
            final slug = ref.watch(discoveryCitySlugProvider);
            return layoutByCity[slug]!;
          }),
          cityCatalogTotalProvider.overrideWith((ref) async => 20),
          categoriesProvider.overrideWith((ref) async => List.generate(9, _cat)),
          promotionsProvider.overrideWith(
            (ref) async => PaginatedPromotions(items: const []),
          ),
          homeOrganicRecommendationsProvider.overrideWith((ref) async => const []),
          businessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
          ),
          unreadNotificationsProvider.overrideWith((ref) async => 0),
          userLocationProvider.overrideWith((ref) => Stream.value(null)),
          homeVipBannerAdsProvider.overrideWith((ref) async => [_vipAd()]),
          homeFeaturedAdsProvider.overrideWith((ref) async => const []),
          homePromotionsAdsProvider.overrideWith((ref) async => const []),
        ],
        child: wrapWithL10n(const HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(_top(tester, const Key('home_section_categories')),
        lessThan(_top(tester, const Key('home_section_popular'))));
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });
}
