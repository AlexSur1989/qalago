import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/user_location_provider.dart';
import '../../search/catalog_explicit_user_location.dart';
import '../../search/search_geo_policy.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/consumer_api_errors.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/theme_extensions.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_components.dart';
import '../../ads/data/ad_models.dart';
import '../../ads/data/ad_placement_codes.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../ads/widgets/sponsored_business_section.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../map/map_discovery_scope.dart';
import '../data/category_catalog_sort.dart';
import '../data/category_l10n.dart';
import '../providers/category_sort_provider.dart';
import '../utils/category_display.dart';
import '../utils/category_list_utils.dart';
import 'category_subcategory_filter.dart';
import 'subcategory_icon_grid.dart';

typedef CategoryBusinessesQuery = ({
  String categoryId,
  String? subcategoryId,
  CategoryCatalogSort sort,
  double? latitude,
  double? longitude,
});

typedef CategoryRecommendedQuery = ({
  String categoryId,
  String? subcategoryId,
});

final categoryRecommendedProvider =
    FutureProvider.family<List<BusinessModel>, CategoryRecommendedQuery>(
        (ref, query) async {
  final city = ref.watch(cityProvider);
  final page = await ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        categoryId: query.categoryId,
        subcategoryId: query.subcategoryId,
        sort: CategoryCatalogSort.recommended.apiValue,
        limit: 20,
      );
  return page.items;
});

final categoryBusinessesProvider =
    FutureProvider.family<PaginatedBusinesses, CategoryBusinessesQuery>(
        (ref, query) async {
  final city = ref.watch(cityProvider);
  return ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        categoryId: query.categoryId,
        subcategoryId: query.subcategoryId,
        sort: query.sort.apiValue,
        latitude: query.latitude,
        longitude: query.longitude,
        limit: 100,
      );
});

class CategoryBusinessesScreen extends ConsumerWidget {
  const CategoryBusinessesScreen({
    super.key,
    required this.categoryId,
    required this.categoryTitle,
  });

  final String categoryId;
  final String categoryTitle;

  String _resolveTitle(
    WidgetRef ref,
    String localeCode,
    AppLocalizations l10n,
  ) {
    final fromRoute = categoryTitle.trim();
    final categories = ref.watch(categoriesProvider).valueOrNull;
    if (categories != null) {
      for (final category in categories) {
        if (category.id == categoryId) {
          return categoryDisplayName(category, localeCode: localeCode);
        }
      }
    }
    if (fromRoute.isNotEmpty && fromRoute != l10n.categoryFallbackTitle) {
      return fromRoute;
    }
    return fromRoute.isEmpty ? l10n.categoryFallbackTitle : fromRoute;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final displayTitle = _resolveTitle(ref, localeCode, l10n);
    final cityName = ref.watch(cityLocalizedNameProvider);
    final sort = ref.watch(categoryCatalogSortProvider);
    ref.watch(catalogExplicitUserGpsProvider);
    final userGps = readCatalogUserGpsForGeoQueries(ref);
    final lat =
        sort == CategoryCatalogSort.nearest ? userGps?.latitude : null;
    final lng =
        sort == CategoryCatalogSort.nearest ? userGps?.longitude : null;

    final subcategoryId = ref.watch(categorySubcategoryFilterProvider(categoryId));

    final businessesAsync = ref.watch(
      categoryBusinessesProvider((
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        sort: sort,
        latitude: lat,
        longitude: lng,
      )),
    );
    final recommendedAsync = ref.watch(
      categoryRecommendedProvider((
        categoryId: categoryId,
        subcategoryId: subcategoryId,
      )),
    );
    final topAdsAsync = ref.watch(
      serveAdsProvider(
        AdServeScope(
          placementCode: AdPlacementCodes.categoryTop,
          categoryId: categoryId,
        ),
      ),
    );
    final boostAdsAsync = ref.watch(
      serveAdsProvider(
        AdServeScope(
          placementCode: AdPlacementCodes.categoryBoost,
          categoryId: categoryId,
        ),
      ),
    );

    void refresh() {
      ref.invalidate(categoryBusinessesProvider);
      ref.invalidate(categoryRecommendedProvider);
      ref.invalidate(categorySubcategoriesProvider(categoryId));
      invalidateAdProviders(ref);
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              displayTitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              cityName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.bodySecondaryStyle.copyWith(
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        leading: qalagoBackLeading(context, fallbackLocation: '/categories'),
        actions: [
          IconButton(
            tooltip: l10n.businessOnMap,
            icon: const Icon(Icons.map_outlined),
            onPressed: () {
              final sub = ref.read(categorySubcategoryFilterProvider(categoryId));
              ref.read(mapDiscoveryScopeProvider.notifier).state =
                  MapDiscoveryScope(
                categoryId: categoryId,
                subcategoryId: sub != null && sub.isNotEmpty ? sub : null,
              );
              context.push('/map');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: Theme.of(context).colorScheme.primary,
        onRefresh: () async => refresh(),
        child: businessesAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) {
            assert(() {
              debugPrint('[QalaGo Category] businesses error: $e');
              return true;
            }());
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                ErrorView(
                  message: localizedLoadError(l10n, e),
                  onRetry: refresh,
                ),
              ],
            );
          },
          data: (data) {
            final topAds = topAdsAsync.valueOrNull ?? const [];
            final boostAds = boostAdsAsync.valueOrNull ?? const [];
            final sponsoredAds = [...topAds, ...boostAds];
            final paidIds = collectPaidBusinessIds(sponsoredAds);

            final recommendedOrganic = recommendedAsync.valueOrNull == null
                ? const <BusinessModel>[]
                : buildCategoryRecommendedOrganic(
                    recommendedSorted: recommendedAsync.valueOrNull!,
                    paidBusinessIds: paidIds,
                  );

            final allPlaces = categoryAllPlacesAfterSponsored(
              allPlaces: data.items,
              sponsoredBusinessIdsInOrder: sponsoredAds
                  .map((ad) => ad.business?['id'] as String?)
                  .whereType<String>(),
            );

            final subFilterActive =
                subcategoryId != null && subcategoryId.isNotEmpty;
            final listEmpty = data.items.isEmpty &&
                recommendedOrganic.isEmpty &&
                sponsoredAds.isEmpty;

            final allPlacesSubtitle = _allPlacesSubtitle(
              l10n: l10n,
              cityName: cityName,
              catalogTotal: data.total,
              loadedCount: allPlaces.length,
            );

            if (listEmpty) {
              final emptyMessage = subFilterActive
                  ? l10n.categorySubEmpty
                  : l10n.categoryEmpty;
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(QalaGoSpacing.space24),
                children: [
                  SubcategoryIconGrid(categoryId: categoryId),
                  const SizedBox(height: QalaGoSpacing.space16),
                  _CategorySortBar(
                    sort: sort,
                    onSelected: (value) {
                      unawaited(
                        _onCategorySortSelected(context, ref, value),
                      );
                    },
                  ),
                  const SizedBox(height: 80),
                  Center(
                    child: Text(
                      emptyMessage,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              );
            }

            final nearestBlocked = sort == CategoryCatalogSort.nearest &&
                (lat == null || lng == null);

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                SubcategoryIconGrid(categoryId: categoryId),
                const SizedBox(height: QalaGoSpacing.space12),
                _CategorySortBar(
                  sort: sort,
                  onSelected: (value) {
                    unawaited(
                      _onCategorySortSelected(context, ref, value),
                    );
                  },
                ),
                if (nearestBlocked) ...[
                  const SizedBox(height: QalaGoSpacing.space12),
                  Text(
                    l10n.categoryNearestNeedsLocation,
                    style: context.bodySecondaryStyle.copyWith(height: 1.35),
                  ),
                ],
                const SizedBox(height: QalaGoSpacing.space16),
                if (recommendedOrganic.isNotEmpty) ...[
                  QalaGoSectionHeader(title: l10n.categoryRecommended),
                  const SizedBox(height: QalaGoSpacing.space12),
                  ..._organicBusinessCards(context, recommendedOrganic),
                  const SizedBox(height: QalaGoSpacing.space20),
                ],
                if (sponsoredAds.isNotEmpty) ...[
                  SponsoredBusinessSection(
                    title: l10n.categorySponsored,
                    items: sponsoredAds,
                  ),
                  const SizedBox(height: QalaGoSpacing.space20),
                ],
                if (allPlaces.isNotEmpty) ...[
                  QalaGoSectionHeader(
                    title: l10n.categoryAllPlaces,
                    subtitle: allPlacesSubtitle,
                  ),
                  const SizedBox(height: QalaGoSpacing.space12),
                  ..._organicBusinessCards(context, allPlaces),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  static String? _allPlacesSubtitle({
    required AppLocalizations l10n,
    required String cityName,
    required int catalogTotal,
    required int loadedCount,
  }) {
    if (catalogTotal <= 0) return cityName;
    if (catalogTotal > loadedCount) {
      return '$cityName · ${l10n.placesCount(catalogTotal)}';
    }
    if (catalogTotal == loadedCount) {
      return '$cityName · ${l10n.placesCount(catalogTotal)}';
    }
    return cityName;
  }

  static List<Widget> _organicBusinessCards(
    BuildContext context,
    List<BusinessModel> items,
  ) {
    return [
      for (final business in items)
        Padding(
          padding: const EdgeInsets.only(bottom: QalaGoSpacing.space12),
          child: TrackedBusinessCard(
            business: business,
            trafficSource: BusinessTrafficSource.category,
            onTap: () => openBusiness(
              context,
              business.id,
              BusinessTrafficSource.category,
            ),
          ),
        ),
    ];
  }
}

class _CategorySortBar extends StatelessWidget {
  const _CategorySortBar({
    required this.sort,
    required this.onSelected,
  });

  final CategoryCatalogSort sort;
  final ValueChanged<CategoryCatalogSort> onSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        QalaGoSectionHeader(title: l10n.categoriesSort),
        const SizedBox(height: QalaGoSpacing.space8),
        Wrap(
          spacing: QalaGoSpacing.space8,
          runSpacing: QalaGoSpacing.space8,
          children: [
            for (final option in CategoryCatalogSort.values)
              Semantics(
                button: true,
                selected: sort == option,
                label: categorySortOptionLabel(l10n, option),
                child: ChoiceChip(
                  label: Text(categorySortOptionLabel(l10n, option)),
                  selected: sort == option,
                  onSelected: (_) => onSelected(option),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  visualDensity: VisualDensity.standard,
                  padding: const EdgeInsets.symmetric(
                    horizontal: QalaGoSpacing.space8,
                    vertical: QalaGoSpacing.space4,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

Future<void> _onCategorySortSelected(
  BuildContext context,
  WidgetRef ref,
  CategoryCatalogSort value,
) async {
  if (value != CategoryCatalogSort.nearest) {
    ref.read(categoryCatalogSortProvider.notifier).state = value;
    return;
  }

  final location = await resolveCatalogUserLocation(ref);
  if (!context.mounted) return;
  if (!location.isSuccess) {
    await showCatalogLocationOutcomeFeedback(context, location);
    return;
  }

  ref.read(categoryCatalogSortProvider.notifier).state =
      CategoryCatalogSort.nearest;
}

void openCategory(
  BuildContext context,
  CategoryModel category, {
  String localeCode = 'ru',
}) {
  final title = categoryDisplayName(category, localeCode: localeCode);
  context.push(
    '/categories/${category.id}?title=${Uri.encodeComponent(title)}',
  );
}
