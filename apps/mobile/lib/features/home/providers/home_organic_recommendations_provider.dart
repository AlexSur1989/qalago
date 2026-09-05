import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/models.dart';
import '../../ads/data/ad_models.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../auth/providers/auth_provider.dart';

/// Organic home recommendations with HOME_FEATURED business IDs excluded.
final homeOrganicRecommendationsProvider =
    FutureProvider<List<RecommendedBusiness>>((ref) async {
  final recommended = await ref.watch(recommendedBusinessesProvider.future);
  final featuredAds = ref.watch(homeFeaturedAdsProvider).valueOrNull ?? const [];
  final paidIds = collectPaidBusinessIds(featuredAds);
  if (paidIds.isEmpty) return recommended;
  return recommended
      .where((item) => !paidIds.contains(item.business.id))
      .toList();
});
