import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/business_rank.dart';
import '../../../shared/widgets/business_card.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../ads/data/ad_models.dart';
import '../../ads/data/ad_placement_codes.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../ads/widgets/sponsored_business_section.dart';
import '../../auth/providers/auth_provider.dart';

const _categoryRadiusKm = nearbyRadiusKm;

final categoryBusinessesProvider =
    FutureProvider.family<PaginatedBusinesses, String>((ref, categoryId) async {
  final city = ref.watch(cityProvider);
  final position = ref.watch(nearbySearchPositionProvider);
  return ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        categoryId: categoryId,
        latitude: position.latitude,
        longitude: position.longitude,
        radiusKm: _categoryRadiusKm,
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
    final businessesAsync = ref.watch(categoryBusinessesProvider(categoryId));
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

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(categoryTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/categories');
            }
          },
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.kzBlue,
        onRefresh: () async {
          ref.invalidate(categoryBusinessesProvider(categoryId));
          invalidateAdProviders(ref);
        },
        child: businessesAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              ErrorView(
                message: '$e',
                onRetry: () =>
                    ref.invalidate(categoryBusinessesProvider(categoryId)),
              ),
            ],
          ),
          data: (data) {
            final topAds = topAdsAsync.valueOrNull ?? const [];
            final boostAds = boostAdsAsync.valueOrNull ?? const [];
            final paidIds = collectPaidBusinessIds([...topAds, ...boostAds]);

            final organicItems = data.items
                .where((b) => !paidIds.contains(b.id))
                .toList();

            if (data.items.isEmpty &&
                topAds.isEmpty &&
                boostAds.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: const [
                  SizedBox(height: 80),
                  Center(
                    child: Text(
                      'В радиусе 3 км от вас пока нет заведений\nв этой категории',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              );
            }

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                if (topAds.isNotEmpty) ...[
                  SponsoredBusinessSection(
                    title: 'Рекомендуемые',
                    items: topAds,
                  ),
                  const SizedBox(height: 20),
                ],
                if (boostAds.isNotEmpty) ...[
                  SponsoredBusinessSection(
                    title: 'Продвигаются',
                    items: boostAds,
                  ),
                  const SizedBox(height: 20),
                ],
                if (organicItems.isNotEmpty) ...[
                  _SectionTitle(
                    title: 'Все места',
                    subtitle:
                        'До 3 км · ${organicItems.length} ${_pluralPlaces(organicItems.length)}',
                  ),
                  const SizedBox(height: 12),
                  ..._organicBusinessCards(context, organicItems),
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
    final tiers = splitBusinessesByTier(items);
    final widgets = <Widget>[];

    void addGroup(String title, List<BusinessModel> group) {
      if (group.isEmpty) return;
      widgets.add(_SectionTitle(title: title));
      widgets.add(const SizedBox(height: 12));
      for (final business in group) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: BusinessCard(
              business: business,
              onTap: () => context.push('/business/${business.id}'),
            ),
          ),
        );
      }
      widgets.add(const SizedBox(height: 8));
    }

    addGroup('Топ города', tiers.top);
    addGroup('VIP · Pro', tiers.pro);
    addGroup(
      tiers.top.isEmpty && tiers.pro.isEmpty ? 'Заведения' : 'Все остальные',
      tiers.regular,
    );

    return widgets;
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
            color: Colors.black,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: TextStyle(color: Colors.black.withValues(alpha: 0.55)),
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
