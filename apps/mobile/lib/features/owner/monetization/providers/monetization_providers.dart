import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/providers/auth_provider.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_models.dart';

typedef MonetizationBusinessQuery = ({String businessId, String? citySlug, String? categoryId});

final monetizationProductsProvider =
    FutureProvider.family<List<MonetizationProduct>, MonetizationBusinessQuery>(
  (ref, query) async {
    final catalog = ref.watch(catalogRepositoryProvider);
    final raw = await catalog.fetchMonetizationProducts(
      businessId: query.businessId,
      citySlug: query.citySlug,
      categoryId: query.categoryId,
    );
    return raw.map(MonetizationProduct.fromJson).toList();
  },
);

final monetizationPackagesProvider =
    FutureProvider<List<MonetizationPackage>>((ref) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final raw = await catalog.fetchMonetizationPackages();
  return raw.map(MonetizationPackage.fromJson).toList();
});

typedef MonetizationQuoteRequest = ({
  String businessId,
  String? productCode,
  String? packageCode,
  int? durationDays,
  int? durationHours,
  String? desiredStartAt,
  String? citySlug,
  String? categoryId,
});

final monetizationQuoteProvider =
    FutureProvider.family<MonetizationQuote, MonetizationQuoteRequest>(
  (ref, request) async {
    final catalog = ref.watch(catalogRepositoryProvider);
    final body = <String, dynamic>{
      'businessId': request.businessId,
      if (request.productCode != null) 'productCode': request.productCode,
      if (request.packageCode != null) 'packageCode': request.packageCode,
      if (request.durationDays != null) 'durationDays': request.durationDays,
      if (request.durationHours != null) 'durationHours': request.durationHours,
      if (request.desiredStartAt != null) 'desiredStartAt': request.desiredStartAt,
      if (request.citySlug != null) 'citySlug': request.citySlug,
      if (request.categoryId != null) 'categoryId': request.categoryId,
    };
    final raw = await catalog.fetchMonetizationQuote(body);
    return MonetizationQuote.fromJson(raw);
  },
);

final ownerMonetizationOrdersProvider =
    FutureProvider.family<List<MonetizationOrder>, String>((ref, businessId) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final raw = await catalog.fetchMonetizationOrders(businessId);
  return raw.map(MonetizationOrder.fromJson).toList();
});

final ownerMonetizationOrderProvider =
    FutureProvider.family<MonetizationOrder, String>((ref, orderId) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final raw = await catalog.fetchMonetizationOrder(orderId);
  return MonetizationOrder.fromJson(raw);
});

final ownerMonetizationCampaignsProvider =
    FutureProvider.family<List<MonetizationCampaign>, String>((ref, businessId) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final raw = await catalog.fetchMonetizationCampaigns(businessId);
  return raw.map(MonetizationCampaign.fromJson).toList();
});

final ownerMonetizationCampaignProvider =
    FutureProvider.family<MonetizationCampaign, String>((ref, campaignId) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final raw = await catalog.fetchMonetizationCampaign(campaignId);
  return MonetizationCampaign.fromJson(raw);
});

final campaignAnalyticsProvider =
    FutureProvider.family<MonetizationCampaignAnalytics, String>(
  (ref, campaignId) async {
    final catalog = ref.watch(catalogRepositoryProvider);
    final raw = await catalog.fetchCampaignAnalytics(campaignId);
    return MonetizationCampaignAnalytics.fromJson(raw);
  },
);

void invalidateOwnerMonetization(WidgetRef ref, String businessId) {
  ref.invalidate(monetizationProductsProvider);
  ref.invalidate(monetizationPackagesProvider);
  ref.invalidate(ownerMonetizationOrdersProvider(businessId));
  ref.invalidate(ownerMonetizationCampaignsProvider(businessId));
}

void invalidateOwnerMonetizationOnBusinessSwitch(WidgetRef ref, String? businessId) {
  ref.invalidate(monetizationProductsProvider);
  ref.invalidate(monetizationPackagesProvider);
  ref.invalidate(monetizationQuoteProvider);
  if (businessId != null) {
    ref.invalidate(ownerMonetizationOrdersProvider(businessId));
    ref.invalidate(ownerMonetizationCampaignsProvider(businessId));
  }
}
