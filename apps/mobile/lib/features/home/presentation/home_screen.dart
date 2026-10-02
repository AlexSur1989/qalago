import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/deep_links/deep_link_session_city.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../auth/presentation/dev_quick_login_panel.dart';
import '../../auth/providers/auth_provider.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../categories/presentation/category_businesses_screen.dart';
import '../data/home_section_type.dart';
import '../providers/home_discovery_layout_provider.dart';
import '../providers/home_organic_recommendations_provider.dart';
import 'home_discovery_sections.dart';
import 'home_layout.dart';
import 'sections/home_header_section.dart';
import 'sections/home_search_section.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/loading_view.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final city = ref.watch(discoveryCityProvider);
    final catalogTotalAsync = ref.watch(cityCatalogTotalProvider);
    final isEmptyCity =
        catalogTotalAsync.hasValue && catalogTotalAsync.value == 0;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final layoutAsync = ref.watch(homeDiscoveryLayoutProvider);
    final discoverySections = layoutAsync.when(
      data: (sections) => sections,
      loading: () => kHomeDiscoverySectionFallback,
      error: (_, _stack) => kHomeDiscoverySectionFallback,
    );

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          onRefresh: () async {
            ref.invalidate(homeDiscoveryLayoutProvider);
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
                      else
                        HomeDiscoverySections(
                          sections: discoverySections,
                          localeCode: localeCode,
                          onCategorySelected: (category) {
                            openCategory(
                              context,
                              category,
                              localeCode: localeCode,
                            );
                          },
                        ),
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
