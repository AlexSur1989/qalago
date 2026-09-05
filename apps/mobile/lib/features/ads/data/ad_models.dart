import '../../../shared/models/models.dart';

/// Tracking context for a served ad — not part of core Business domain.
class AdContext {
  const AdContext({
    required this.campaignId,
    required this.placementId,
    required this.placementCode,
    required this.sessionId,
    this.position,
  });

  final String campaignId;
  final String placementId;
  final String placementCode;
  final String sessionId;
  final int? position;
}

class AdCreativeModel {
  const AdCreativeModel({
    required this.id,
    required this.title,
    this.imageUrl,
    this.description,
    this.buttonText,
    this.targetType,
    this.targetId,
    this.targetUrl,
  });

  final String id;
  final String title;
  final String? imageUrl;
  final String? description;
  final String? buttonText;
  final String? targetType;
  final String? targetId;
  final String? targetUrl;

  factory AdCreativeModel.fromJson(Map<String, dynamic> json) => AdCreativeModel(
        id: json['id'] as String,
        title: json['title'] as String,
        imageUrl: json['imageUrl'] as String?,
        description: json['description'] as String?,
        buttonText: json['buttonText'] as String?,
        targetType: json['targetType'] as String?,
        targetId: json['targetId'] as String?,
        targetUrl: json['targetUrl'] as String?,
      );
}

class AdItemModel {
  const AdItemModel({
    required this.campaignId,
    required this.placementId,
    required this.placementCode,
    required this.position,
    required this.sponsored,
    required this.displayLabel,
    this.productType,
    this.business,
    this.creative,
    this.promotion,
  });

  final String campaignId;
  final String placementId;
  final String placementCode;
  final int position;
  final bool sponsored;
  final String displayLabel;
  final String? productType;
  final Map<String, dynamic>? business;
  final AdCreativeModel? creative;
  final Map<String, dynamic>? promotion;

  factory AdItemModel.fromJson(Map<String, dynamic> json) {
    final creativeJson = json['creative'] as Map<String, dynamic>?;
    final promotionJson = json['promotion'] as Map<String, dynamic>?;
    return AdItemModel(
      campaignId: json['campaignId'] as String,
      placementId: json['placementId'] as String,
      placementCode: json['placementCode'] as String,
      position: json['position'] as int? ?? 1,
      sponsored: json['sponsored'] as bool? ?? true,
      displayLabel: json['displayLabel'] as String? ?? 'Реклама',
      productType: json['productType'] as String?,
      business: json['business'] as Map<String, dynamic>?,
      creative:
          creativeJson != null ? AdCreativeModel.fromJson(creativeJson) : null,
      promotion: promotionJson,
    );
  }

  AdContext toContext(String sessionId) => AdContext(
        campaignId: campaignId,
        placementId: placementId,
        placementCode: placementCode,
        sessionId: sessionId,
        position: position,
      );

  BusinessModel? toBusinessModel() {
    if (business == null) return null;
    try {
      return mapAdBusinessToModel(business!);
    } catch (_) {
      return null;
    }
  }

  PromotionModel? toPromotionModel() {
    if (promotion == null) return null;
    final promo = Map<String, dynamic>.from(promotion!);
    if (business != null && promo['business'] == null) {
      promo['business'] = normalizeAdBusinessJson(business!);
    } else if (promo['business'] is Map<String, dynamic>) {
      promo['business'] = normalizeAdBusinessJson(
        promo['business'] as Map<String, dynamic>,
      );
    }
    try {
      return PromotionModel.fromJson(promo);
    } catch (_) {
      return null;
    }
  }
}

class AdServeResponse {
  const AdServeResponse({
    required this.placementCode,
    required this.items,
  });

  final String placementCode;
  final List<AdItemModel> items;

  factory AdServeResponse.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? [])
        .map((e) => AdItemModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return AdServeResponse(
      placementCode: json['placementCode'] as String,
      items: items,
    );
  }
}

/// Ad serve API may return a minimal business subset (id/title/slug only).
Map<String, dynamic> normalizeAdBusinessJson(Map<String, dynamic> json) {
  return {
    ...json,
    'slug': json['slug'] as String? ?? '',
    'address': json['address'] as String? ?? '',
  };
}

BusinessModel mapAdBusinessToModel(Map<String, dynamic> json) {
  return BusinessModel.fromJson(normalizeAdBusinessJson(json));
}

Set<String> collectPaidBusinessIds(Iterable<AdItemModel> items) {
  final ids = <String>{};
  for (final item in items) {
    final id = item.business?['id'] as String?;
    if (id != null && id.isNotEmpty) ids.add(id);
  }
  return ids;
}
