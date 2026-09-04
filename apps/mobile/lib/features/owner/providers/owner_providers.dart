import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_utils.dart';

final selectedOwnerBusinessIdProvider =
    NotifierProvider<SelectedOwnerBusinessIdNotifier, String?>(
  SelectedOwnerBusinessIdNotifier.new,
);

class SelectedOwnerBusinessIdNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void select(String? businessId) {
    state = businessId;
  }
}

final ownerSelectedBusinessProvider = Provider<Map<String, dynamic>?>((ref) {
  final businessesAsync = ref.watch(myBusinessesProvider);
  final selectedId = ref.watch(selectedOwnerBusinessIdProvider);
  return businessesAsync.maybeWhen(
    data: (items) {
      if (items.isEmpty) return null;
      if (selectedId != null) {
        for (final item in items) {
          if (item['id'] == selectedId) return item;
        }
      }
      return items.first;
    },
    orElse: () => null,
  );
});

typedef OwnerDashboardQuery = String;

final ownerDashboardProvider =
    FutureProvider.family<Map<String, dynamic>, OwnerDashboardQuery>(
  (ref, businessId) async {
    final catalog = ref.watch(catalogRepositoryProvider);
    final results = await Future.wait([
      catalog.fetchAnalyticsSummary(businessId, days: 7),
      catalog.fetchAnalyticsSummary(businessId, days: 14),
      catalog.fetchAnalyticsTrends(businessId, days: 7),
      catalog.fetchBusinessPromotions(businessId),
      catalog.fetchBusinessPlan(businessId),
    ]);
    final summary7 = results[0] as Map<String, dynamic>;
    final summary14 = results[1] as Map<String, dynamic>;
    final byType7 = ownerByType(summary7);
    final byType14 = ownerByType(summary14);
    final prevByType = <String, int>{};
    for (final key in {...byType7.keys, ...byType14.keys}) {
      prevByType[key] = (byType14[key] ?? 0) - (byType7[key] ?? 0);
    }
    final promotions = results[3] as List<dynamic>;
    final activePromotions = promotions
        .where((p) => p is Map && p['status'] == 'ACTIVE')
        .cast<Map<String, dynamic>>()
        .toList();
    return {
      'summary7': summary7,
      'prevByType': prevByType,
      'trends': results[2],
      'activePromotions': activePromotions,
      'plan': results[4],
    };
  },
);

final businessPlanProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, businessId) async {
  return ref.watch(catalogRepositoryProvider).fetchBusinessPlan(businessId);
});

final plansCatalogProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(catalogRepositoryProvider).fetchPlans();
});
