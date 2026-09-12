import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../ads/data/ad_models.dart';
import '../../ads/data/ad_placement_codes.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../ads/widgets/sponsored_business_section.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/category_catalog_sort.dart';
import '../data/category_discovery_strings.dart';
import '../providers/category_sort_provider.dart';
import '../utils/category_list_utils.dart';
import 'category_subcategory_filter.dart';

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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const localeCode = 'ru';
    final city = ref.watch(cityProvider);
    final sort = ref.watch(categoryCatalogSortProvider);
    final userPosition = ref.watch(userLocationProvider).valueOrNull;
    final lat = sort == CategoryCatalogSort.nearest
        ? userPosition?.snapped.latitude
        : null;
    final lng = sort == CategoryCatalogSort.nearest
        ? userPosition?.snapped.longitude
        : null;

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
            Text(categoryTitle),
            Text(
              city.nameRu,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
        leading: qalagoBackLeading(context, fallbackLocation: '/categories'),
      ),
      body: RefreshIndicator(
        color: Theme.of(context).colorScheme.primary,
        onRefresh: () async => refresh(),
        child: businessesAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              ErrorView(message: '$e', onRetry: refresh),
            ],
          ),
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

            final subFilterActive = subcategoryId != null && subcategoryId.isNotEmpty;
            final listEmpty =
                data.items.isEmpty && recommendedOrganic.isEmpty && sponsoredAds.isEmpty;

            if (listEmpty) {
              final emptyMessage = subFilterActive
                  ? CategoryDiscoveryStrings.emptySubcategoryFilter
                  : CategoryDiscoveryStrings.emptyCategory;
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: [
                  CategorySubcategoryFilterBar(
                    categoryId: categoryId,
                    localeCode: localeCode,
                  ),
                  const SizedBox(height: 16),
                  _CategorySortBar(
                    sort: sort,
                    localeCode: localeCode,
                    onSelected: (value) {
                      ref.read(categoryCatalogSortProvider.notifier).state = value;
                    },
                  ),
                  const SizedBox(height: 80),
                  Center(
                    child: Text(
                      CategoryDiscoveryStrings.sectionTitle(
                        emptyMessage,
                        localeCode: localeCode,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              );
            }

            final nearestBlocked = sort == CategoryCatalogSort.nearest &&
                (lat == null || lng == null);

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                CategorySubcategoryFilterBar(
                  categoryId: categoryId,
                  localeCode: localeCode,
                ),
                const SizedBox(height: 12),
                _CategorySortBar(
                  sort: sort,
                  localeCode: localeCode,
                  onSelected: (value) {
                    ref.read(categoryCatalogSortProvider.notifier).state = value;
                  },
                ),
                if (nearestBlocked) ...[
                  const SizedBox(height: 12),
                  Text(
                    CategoryDiscoveryStrings.sectionTitle(
                      CategoryDiscoveryStrings.nearestNeedsLocation,
                      localeCode: localeCode,
                    ),
                    style: TextStyle(
                      color: AppTheme.textDark.withValues(alpha: 0.65),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                if (recommendedOrganic.isNotEmpty) ...[
                  _SectionTitle(
                    title: CategoryDiscoveryStrings.sectionTitle(
                      CategoryDiscoveryStrings.recommendedSection,
                      localeCode: localeCode,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._organicBusinessCards(context, recommendedOrganic),
                  const SizedBox(height: 20),
                ],
                if (sponsoredAds.isNotEmpty) ...[
                  SponsoredBusinessSection(
                    title: CategoryDiscoveryStrings.sectionTitle(
                      CategoryDiscoveryStrings.sponsoredSection,
                      localeCode: localeCode,
                    ),
                    items: sponsoredAds,
                  ),
                  const SizedBox(height: 20),
                ],
                if (allPlaces.isNotEmpty) ...[
                  _SectionTitle(
                    title: CategoryDiscoveryStrings.sectionTitle(
                      CategoryDiscoveryStrings.allPlacesSection,
                      localeCode: localeCode,
                    ),
                    subtitle:
                        '${city.nameRu} · ${allPlaces.length} ${_pluralPlaces(allPlaces.length)}',
                  ),
                  const SizedBox(height: 12),
                  ..._organicBusinessCards(context, allPlaces),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  static List<Widget> _organicBusinessCards(
    BuildContext context,
    List<BusinessModel> items,
  ) {
    return [
      for (final business in items)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
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

  static String _pluralPlaces(int count) {
    final mod10 = count % 10;
    final mod100 = count % 100;
    if (mod10 == 1 && mod100 != 11) return 'место';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return 'места';
    }
    return 'мест';
  }
}

class _CategorySortBar extends StatelessWidget {
  const _CategorySortBar({
    required this.sort,
    required this.localeCode,
    required this.onSelected,
  });

  final CategoryCatalogSort sort;
  final String localeCode;
  final ValueChanged<CategoryCatalogSort> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          CategoryDiscoveryStrings.sectionTitle(
            CategoryDiscoveryStrings.sortLabel,
            localeCode: localeCode,
          ),
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14,
            color: AppTheme.textDark,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final option in CategoryCatalogSort.values)
              ChoiceChip(
                label: Text(
                  CategoryDiscoveryStrings.sortOptionLabel(
                    option,
                    localeCode: localeCode,
                  ),
                ),
                selected: sort == option,
                onSelected: (_) => onSelected(option),
              ),
          ],
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: AppTheme.textDark,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: TextStyle(color: AppTheme.textDark.withValues(alpha: 0.55)),
          ),
        ],
      ],
    );
  }
}

String categoryDisplayTitle(CategoryModel category) {
  return category.title;
}

void openCategory(BuildContext context, CategoryModel category) {
  final title = categoryDisplayTitle(category);
  context.push(
    '/categories/${category.id}?title=${Uri.encodeComponent(title)}',
  );
}
