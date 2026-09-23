import 'package:flutter/widgets.dart';

import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../data/ad_models.dart';

/// Location for ad-origin navigation: serve item fields only (no client branch logic).
String? adNavigationLocationId(
  AdItemModel item, {
  PromotionModel? promotion,
}) {
  final fromAd = item.resolvedDestinationLocationId;
  if (fromAd != null) return fromAd;
  final promoCtx = promotion?.contextLocationId?.trim();
  if (promoCtx != null && promoCtx.isNotEmpty) return promoCtx;
  return null;
}

/// Opens business detail from a served ad item (Business-grain identity + backend branch).
void openBusinessFromAdItem(
  BuildContext context,
  AdItemModel item,
  BusinessTrafficSource source,
) {
  final businessId =
      item.business?['id'] as String? ?? item.toBusinessModel()?.id;
  if (businessId == null || businessId.isEmpty) return;
  openBusiness(
    context,
    businessId,
    source,
    selectedLocationId: item.resolvedDestinationLocationId,
  );
}

/// HOME_PROMOTIONS / VIP promotion target — preserves backend ad destination.
void openPromotionFromAdItem(BuildContext context, AdItemModel item) {
  final promotion = item.toPromotionModel();
  if (promotion == null) return;
  openBusinessFromPromotion(
    context,
    promotion,
    BusinessTrafficSource.ad,
    selectedLocationId: adNavigationLocationId(item, promotion: promotion),
  );
}
