import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/data/ad_placement_codes.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/presentation/home_screen.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

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

Future<void> _pumpHome(
  WidgetTester tester, {
  Locale locale = const Locale('ru'),
  UserPosition? userPosition,
  List<CategoryModel>? categories,
}) async {
  final cats = categories ?? List.generate(9, _cat);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        cityCatalogTotalProvider.overrideWith((ref) async => 20),
        categoriesProvider.overrideWith((ref) async => cats),
        promotionsProvider.overrideWith(
          (ref) async => PaginatedPromotions(
            items: [
              PromotionModel(
                id: 'p1',
                title: 'Promo one',
                business: BusinessModel(
                  id: 'b1',
                  title: 'Biz',
                  slug: 'biz',
                  address: 'Addr',
                ),
              ),
            ],
          ),
        ),
        homeOrganicRecommendationsProvider.overrideWith((ref) async => const []),
        businessesProvider.overrideWith(
          (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
        ),
        unreadNotificationsProvider.overrideWith((ref) async => 0),
        userLocationProvider.overrideWith((ref) => Stream.value(userPosition)),
        homeVipBannerAdsProvider.overrideWith(
          (ref) async => [_vipAd()],
        ),
        homeFeaturedAdsProvider.overrideWith((ref) async => const []),
        homePromotionsAdsProvider.overrideWith((ref) async => const []),
      ],
      child: wrapWithL10n(const HomeScreen(), locale: locale),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _disposeAdTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

double _top(WidgetTester tester, Key key) {
  return tester.getTopLeft(find.byKey(key)).dy;
}

void main() {
  testWidgets('Home sections render in canonical order', (tester) async {
    await _pumpHome(tester);
    final ordered = [
      const Key('home_section_header'),
      const Key('home_section_search'),
      const Key('home_section_categories'),
      const Key('home_section_vip'),
      const Key('home_section_nearby'),
      const Key('home_section_featured'),
      const Key('home_section_promotions'),
      const Key('home_section_popular'),
    ];
    for (final key in ordered) {
      expect(find.byKey(key), findsOneWidget);
    }
    for (var i = 0; i < ordered.length - 1; i++) {
      expect(
        _top(tester, ordered[i]),
        lessThan(_top(tester, ordered[i + 1])),
      );
    }
    expect(find.text('QalaGo AI'), findsNothing);
    await _disposeAdTimers(tester);
  });

  testWidgets('Eight category shortcuts plus All categories', (tester) async {
    await _pumpHome(tester);
    final l10n = lookupAppLocalizations(const Locale('ru'));
    expect(find.text(l10n.commonAllCategories), findsOneWidget);
    expect(find.text('Category 0'), findsOneWidget);
    expect(find.text('Category 7'), findsOneWidget);
    expect(find.text('Category 8'), findsNothing);
    await _disposeAdTimers(tester);
  });

  testWidgets('Nearby uses city wording without GPS', (tester) async {
    await _pumpHome(tester, userPosition: null);
    final l10n = lookupAppLocalizations(const Locale('ru'));
    expect(find.text(l10n.homeNearbyCitySection), findsOneWidget);
    expect(find.text(l10n.homeNearbySection), findsNothing);
    await _disposeAdTimers(tester);
  });

  testWidgets('Nearby uses personal wording with GPS', (tester) async {
    await _pumpHome(
      tester,
      userPosition: const UserPosition(latitude: 51.2278, longitude: 51.3865),
    );
    final l10n = lookupAppLocalizations(const Locale('ru'));
    expect(find.text(l10n.homeNearbySection), findsOneWidget);
    await _disposeAdTimers(tester);
  });

  testWidgets('Popular section title localized KK', (tester) async {
    await _pumpHome(tester, locale: const Locale('kk'));
    final l10n = lookupAppLocalizations(const Locale('kk'));
    expect(find.text(l10n.homePopularSection), findsOneWidget);
    await _disposeAdTimers(tester);
  });

  testWidgets('320px RU textScale 2.0 avoids overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final cats = List.generate(9, _cat);
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(320, 800),
          textScaler: TextScaler.linear(2),
        ),
        child: ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _UralskCityNotifier()),
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
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _disposeAdTimers(tester);
  });
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}
