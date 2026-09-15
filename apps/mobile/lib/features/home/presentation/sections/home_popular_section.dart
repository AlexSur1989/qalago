import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/navigation/business_traffic_source.dart';
import '../../../../shared/navigation/open_business.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../../shared/widgets/qalago_components.dart';
import '../../../analytics/widgets/business_impression_host.dart';
import '../../providers/home_organic_recommendations_provider.dart';
import '../../../auth/providers/auth_provider.dart';

class HomePopularSection extends ConsumerWidget {
  const HomePopularSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final featuredAsync = ref.watch(homeOrganicRecommendationsProvider);

    return Column(
      key: const Key('home_section_popular'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        QalaGoSectionHeader(title: l10n.homePopularSection),
        const SizedBox(height: 12),
        featuredAsync.when(
          loading: () => const SizedBox(height: 194, child: LoadingView()),
          error: (e, _) {
            assert(() {
              debugPrint('[QalaGo Home] popular error: $e');
              return true;
            }());
            return ErrorView(
              message: localizedLoadError(l10n, e),
              onRetry: () {
                ref.invalidate(homeOrganicRecommendationsProvider);
                ref.invalidate(recommendedBusinessesProvider);
              },
            );
          },
          data: (items) => _PopularPlacesStrip(items: items),
        ),
      ],
    );
  }
}

class _PopularPlacesStrip extends StatelessWidget {
  const _PopularPlacesStrip({required this.items});

  final List<RecommendedBusiness> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return SizedBox(
        height: 120,
        child: Center(child: Text(context.l10n.homePopularEmpty)),
      );
    }

    return SizedBox(
      height: 194,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final entry = items[index];
          return SizedBox(
            width: 168,
            child: BusinessImpressionHost(
              businessId: entry.business.id,
              trafficSource: BusinessTrafficSource.home,
              discoverySurface: 'HOME_RECOMMENDED',
              child: _PopularPlaceCard(
                business: entry.business,
                subtitle: entry.reason,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PopularPlaceCard extends StatelessWidget {
  const _PopularPlaceCard({
    required this.business,
    required this.subtitle,
  });

  final BusinessModel business;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () =>
            openBusiness(context, business.id, BusinessTrafficSource.home),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 100,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (coverUrl.isNotEmpty)
                      Image.network(
                        coverUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _popularImagePlaceholder(),
                      )
                    else
                      _popularImagePlaceholder(),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: const Padding(
                          padding: EdgeInsets.all(5),
                          child: Icon(
                            Icons.favorite_border,
                            color: AppTheme.textDark,
                            size: 19,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    business.title,
                    style: const TextStyle(
                      color: AppTheme.textDark,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: Theme.of(context).colorScheme.primary,
                        size: 17,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          subtitle.isNotEmpty
                              ? subtitle
                              : (business.planBadgeLabel ??
                                  business.categoryTitle ??
                                  'QalaGo'),
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 2,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _popularImagePlaceholder() {
  return Container(
    color: AppTheme.background,
    child: const Center(
      child: Icon(Icons.storefront, color: AppTheme.textMuted),
    ),
  );
}
