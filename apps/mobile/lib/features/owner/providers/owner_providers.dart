import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/rbac/business_access.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_utils.dart';
import '../monetization/providers/monetization_providers.dart';

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

void onOwnerBusinessSelected(WidgetRef ref, String businessId) {
  ref.read(selectedOwnerBusinessIdProvider.notifier).select(businessId);
  invalidateOwnerMonetizationOnBusinessSwitch(ref, businessId);
  ref.invalidate(businessAnalyticsDashboardProvider);
}

final ownerSelectedBusinessProvider = Provider<Map<String, dynamic>?>((ref) {
  final entriesAsync = ref.watch(myBusinessEntriesProvider);
  final selectedId = ref.watch(selectedOwnerBusinessIdProvider);
  return entriesAsync.maybeWhen(
    data: (entries) {
      if (entries.isEmpty) return null;
      if (selectedId != null) {
        for (final entry in entries) {
          if (entry.businessId == selectedId) return entry.business;
        }
      }
      return entries.first.business;
    },
    orElse: () => null,
  );
});

final selectedBusinessAccessProvider = Provider<BusinessAccess?>((ref) {
  final entriesAsync = ref.watch(myBusinessEntriesProvider);
  final selectedId = ref.watch(selectedOwnerBusinessIdProvider);
  return entriesAsync.maybeWhen(
    data: (entries) {
      if (entries.isEmpty) return null;
      if (selectedId != null) {
        for (final entry in entries) {
          if (entry.businessId == selectedId) return entry.access;
        }
      }
      return entries.first.access;
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
      catalog.fetchBusinessPromotions(businessId),
      catalog.fetchBusinessPlan(businessId),
    ]);
    final summary7 = results[0] as Map<String, dynamic>;
    final summary14 = results[1] as Map<String, dynamic>;
    final capabilities = summary7['capabilities'] as Map<String, dynamic>? ?? {};
    final trendsAvailable = capabilities['viewTrend'] == true || capabilities['trends'] == true;
    final trends = trendsAvailable
        ? await catalog.fetchAnalyticsTrends(businessId, days: 7)
        : <String, dynamic>{'items': <dynamic>[], 'trendsUnavailable': true};
    final byType7 = ownerByType(summary7);
    final byType14 = ownerByType(summary14);
    final prevByType = <String, int>{};
    for (final key in {...byType7.keys, ...byType14.keys}) {
      prevByType[key] = (byType14[key] ?? 0) - (byType7[key] ?? 0);
    }
    final promotions = results[2] as List<PromotionModel>;
    final activePromotions = promotions
        .where((p) => ownerIsPromotionActiveStatus(p.status))
        .where(ownerIsPromotionLiveNow)
        .toList();
    return {
      'summary7': summary7,
      'prevByType': prevByType,
      'trends': trends,
      'trendsAvailable': trendsAvailable,
      'activePromotions': activePromotions,
      'plan': results[3],
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
