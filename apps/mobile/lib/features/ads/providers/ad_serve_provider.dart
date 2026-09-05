import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../catalog/data/catalog_repository.dart';
import '../data/ad_models.dart';
import '../data/ad_placement_codes.dart';
import 'ad_session_provider.dart';

/// Scope key for ad serve requests.
class AdServeScope {
  const AdServeScope({
    required this.placementCode,
    this.categoryId,
  });

  final String placementCode;
  final String? categoryId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AdServeScope &&
          placementCode == other.placementCode &&
          categoryId == other.categoryId;

  @override
  int get hashCode => Object.hash(placementCode, categoryId);
}

final _adsCatalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

final serveAdsProvider =
    FutureProvider.family<List<AdItemModel>, AdServeScope>((ref, scope) async {
  final city = ref.watch(cityProvider);
  final sessionId = ref.watch(adSessionIdProvider);
  final repo = ref.watch(_adsCatalogRepositoryProvider);

  try {
    final response = await repo.serveAds(
      placementCode: scope.placementCode,
      sessionId: sessionId,
      citySlug: city.slug,
      categoryId: scope.categoryId,
    );
    return response?.items ?? const [];
  } catch (_) {
    return const [];
  }
});

final homeVipBannerAdsProvider = serveAdsProvider(
  const AdServeScope(placementCode: AdPlacementCodes.homeVipBanner),
);

final homePromotionsAdsProvider = serveAdsProvider(
  const AdServeScope(placementCode: AdPlacementCodes.homePromotions),
);

final homeFeaturedAdsProvider = serveAdsProvider(
  const AdServeScope(placementCode: AdPlacementCodes.homeFeatured),
);

void invalidateAdProviders(WidgetRef ref) {
  ref.invalidate(serveAdsProvider);
}
