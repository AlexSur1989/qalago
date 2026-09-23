import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/localized_content.dart';
import '../../auth/presentation/dev_quick_login_panel.dart';
import '../../auth/providers/auth_provider.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../ads/widgets/home_ad_slots.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../categories/presentation/category_businesses_screen.dart';
import '../providers/home_organic_recommendations_provider.dart';
import 'home_layout.dart';
import 'sections/home_categories_section.dart';
import 'sections/home_header_section.dart';
import 'sections/home_nearby_section.dart';
import 'sections/home_popular_section.dart';
import 'sections/home_promoted_section.dart';
import 'sections/home_promotions_section.dart';
import 'sections/home_search_section.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/loading_view.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final city = ref.watch(cityProvider);
    final catalogTotalAsync = ref.watch(cityCatalogTotalProvider);
    final isEmptyCity =
        catalogTotalAsync.hasValue && catalogTotalAsync.value == 0;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(cityCatalogTotalProvider);
            ref.invalidate(businessesProvider);
            ref.invalidate(homeOrganicRecommendationsProvider);
            ref.invalidate(recommendedBusinessesProvider);
            ref.invalidate(promotionsProvider);
            ref.invalidate(unreadNotificationsProvider);
            invalidateAdProviders(ref);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    HomeLayout.horizontalPadding,
                    HomeLayout.topPadding,
                    HomeLayout.horizontalPadding,
                    HomeLayout.bottomPadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      HomeHeaderSection(
                        key: const Key('home_section_header'),
                        cityName: ref.watch(cityLocalizedNameProvider),
                        unreadAsync: ref.watch(unreadNotificationsProvider),
                        onCityTap: () => showCityPickerSheet(context, ref),
                        onNotificationsTap: () =>
                            context.push('/notifications'),
                      ),
                      const DevQuickLoginPanel(),
                      const SizedBox(height: HomeLayout.blockGap),
                      HomeSearchSection(
                        key: const Key('home_section_search'),
                        onTap: () => context.push('/search'),
                      ),
                      const SizedBox(height: HomeLayout.blockGap),
                      if (catalogTotalAsync.isLoading &&
                          !catalogTotalAsync.hasValue)
                        const SizedBox(height: 280, child: LoadingView())
                      else if (isEmptyCity)
                        EmptyCityView(
                          cityName: ref.watch(cityLocalizedNameProvider),
                          isComingSoon: city.isComingSoon,
                          onPickCity: () => showCityPickerSheet(context, ref),
                        )
                      else ...[
                        HomeCategoriesSection(
                          localeCode: localeCode,
                          onCategorySelected: (category) {
                            openCategory(
                              context,
                              category,
                              localeCode: localeCode,
                            );
                          },
                        ),
                        const SizedBox(height: HomeLayout.sectionGap),
                        const HomeVipBannerSlot(),
                        // Canonical #5 QalaGo AI — reserved, not rendered in UI.4B.
                        const SizedBox(height: HomeLayout.sectionGap),
                        const HomeNearbySection(),
                        const SizedBox(height: HomeLayout.sectionGap),
                        const HomePromotedSection(),
                        const SizedBox(height: HomeLayout.sectionGap),
                        HomePromotionsSection(
                          onOrganicPromotionTap: (promotion) {
                            final business = promotion.business;
                            if (business == null) return;
                            unawaited(
                              ref
                                  .read(catalogRepositoryProvider)
                                  .trackPromotionView(
                                    business.id,
                                    promotionId: promotion.id,
                                  ),
                            );
                            openBusinessFromPromotion(
                              context,
                              promotion,
                              BusinessTrafficSource.promotions,
                            );
                          },
                          onPaidPromotionTap: (promotion) {
                            openAdPromotion(context, promotion);
                          },
                        ),
                        const SizedBox(height: HomeLayout.sectionGap),
                        const HomePopularSection(),
                        // Canonical #8 Events / #11 News — reserved, not rendered.
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
