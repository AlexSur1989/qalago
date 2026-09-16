import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/business_card.dart';
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

    final scale = MediaQuery.textScalerOf(context).scale(1.0);
    final stripHeight = (194.0 * scale).clamp(194.0, 320.0);

    return SizedBox(
      height: stripHeight,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final entry = items[index];
          return SizedBox(
            width: 168,
            height: stripHeight,
            child: BusinessImpressionHost(
              businessId: entry.business.id,
              trafficSource: BusinessTrafficSource.home,
              discoverySurface: 'HOME_RECOMMENDED',
              child: BusinessCard(
                business: entry.business,
                layout: BusinessCardLayout.compactVertical,
                subtitle: entry.reason,
                onTap: () => openBusiness(
                  context,
                  entry.business.id,
                  BusinessTrafficSource.home,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
