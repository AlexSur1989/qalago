class MonetizationDurationOption {
  const MonetizationDurationOption({
    this.durationHours,
    this.durationDays,
    required this.basePrice,
    this.discountPercent,
    required this.finalPrice,
    required this.currency,
  });

  final int? durationHours;
  final int? durationDays;
  final num basePrice;
  final num? discountPercent;
  final num finalPrice;
  final String currency;

  factory MonetizationDurationOption.fromJson(Map<String, dynamic> json) {
    return MonetizationDurationOption(
      durationHours: (json['durationHours'] as num?)?.toInt(),
      durationDays: (json['durationDays'] as num?)?.toInt(),
      basePrice: json['basePrice'] as num? ?? 0,
      discountPercent: json['discountPercent'] as num?,
      finalPrice: json['finalPrice'] as num? ?? 0,
      currency: json['currency'] as String? ?? 'KZT',
    );
  }
}

class MonetizationProduct {
  const MonetizationProduct({
    required this.code,
    required this.name,
    this.description,
    required this.type,
    required this.durations,
  });

  final String code;
  final String name;
  final String? description;
  final String type;
  final List<MonetizationDurationOption> durations;

  factory MonetizationProduct.fromJson(Map<String, dynamic> json) {
    final durations = (json['durations'] as List<dynamic>? ?? [])
        .map((e) => MonetizationDurationOption.fromJson(e as Map<String, dynamic>))
        .toList();
    return MonetizationProduct(
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      type: json['type'] as String,
      durations: durations,
    );
  }

  num? lowestPrice() {
    if (durations.isEmpty) return null;
    return durations.map((d) => d.finalPrice).reduce((a, b) => a < b ? a : b);
  }
}

class MonetizationPackageItem {
  const MonetizationPackageItem({
    required this.productCode,
    required this.productName,
    required this.productType,
    this.durationDays,
    this.durationHours,
    required this.quantity,
  });

  final String productCode;
  final String productName;
  final String productType;
  final int? durationDays;
  final int? durationHours;
  final int quantity;

  factory MonetizationPackageItem.fromJson(Map<String, dynamic> json) {
    return MonetizationPackageItem(
      productCode: json['productCode'] as String,
      productName: json['productName'] as String,
      productType: json['productType'] as String,
      durationDays: (json['durationDays'] as num?)?.toInt(),
      durationHours: (json['durationHours'] as num?)?.toInt(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    );
  }
}

class MonetizationPackage {
  const MonetizationPackage({
    required this.code,
    required this.name,
    this.description,
    required this.price,
    required this.currency,
    required this.durationDays,
    this.discountPercent,
    required this.items,
  });

  final String code;
  final String name;
  final String? description;
  final num price;
  final String currency;
  final int durationDays;
  final num? discountPercent;
  final List<MonetizationPackageItem> items;

  factory MonetizationPackage.fromJson(Map<String, dynamic> json) {
    return MonetizationPackage(
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: json['price'] as num? ?? 0,
      currency: json['currency'] as String? ?? 'KZT',
      durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
      discountPercent: json['discountPercent'] as num?,
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => MonetizationPackageItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MonetizationAvailability {
  const MonetizationAvailability({
    required this.available,
    this.reason,
    this.nextAvailableAt,
  });

  final bool available;
  final String? reason;
  final DateTime? nextAvailableAt;

  factory MonetizationAvailability.fromJson(Map<String, dynamic> json) {
    return MonetizationAvailability(
      available: json['available'] as bool? ?? false,
      reason: json['reason'] as String?,
      nextAvailableAt: _parseDate(json['nextAvailableAt']),
    );
  }
}

class MonetizationQuote {
  const MonetizationQuote({
    this.productCode,
    this.productName,
    this.productType,
    this.packageCode,
    this.packageName,
    this.durationDays,
    this.durationHours,
    required this.basePrice,
    required this.discountPercent,
    required this.discountAmount,
    required this.finalPrice,
    required this.currency,
    this.requestedStartAt,
    this.calculatedEndAt,
    required this.availability,
  });

  final String? productCode;
  final String? productName;
  final String? productType;
  final String? packageCode;
  final String? packageName;
  final int? durationDays;
  final int? durationHours;
  final num basePrice;
  final num discountPercent;
  final num discountAmount;
  final num finalPrice;
  final String currency;
  final DateTime? requestedStartAt;
  final DateTime? calculatedEndAt;
  final MonetizationAvailability availability;

  factory MonetizationQuote.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    final package = json['package'] as Map<String, dynamic>?;
    final duration = json['duration'] as Map<String, dynamic>?;
    return MonetizationQuote(
      productCode: product?['code'] as String?,
      productName: product?['name'] as String?,
      productType: product?['type'] as String?,
      packageCode: package?['code'] as String?,
      packageName: package?['name'] as String?,
      durationDays: (duration?['durationDays'] as num?)?.toInt(),
      durationHours: (duration?['durationHours'] as num?)?.toInt(),
      basePrice: json['basePrice'] as num? ?? 0,
      discountPercent: json['discountPercent'] as num? ?? 0,
      discountAmount: json['discountAmount'] as num? ?? 0,
      finalPrice: json['finalPrice'] as num? ?? 0,
      currency: json['currency'] as String? ?? 'KZT',
      requestedStartAt: _parseDate(json['requestedStartAt']),
      calculatedEndAt: _parseDate(json['calculatedEndAt']),
      availability: MonetizationAvailability.fromJson(
        json['availability'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class MonetizationOrderItem {
  const MonetizationOrderItem({
    required this.id,
    required this.productCode,
    required this.productName,
    required this.productType,
    required this.quantity,
    required this.basePrice,
    required this.discountPercent,
    required this.discountAmount,
    required this.finalPrice,
    this.durationHours,
    this.durationDays,
  });

  final String id;
  final String productCode;
  final String productName;
  final String productType;
  final int quantity;
  final num basePrice;
  final num discountPercent;
  final num discountAmount;
  final num finalPrice;
  final int? durationHours;
  final int? durationDays;

  factory MonetizationOrderItem.fromJson(Map<String, dynamic> json) {
    return MonetizationOrderItem(
      id: json['id'] as String,
      productCode: json['productCode'] as String,
      productName: json['productName'] as String,
      productType: json['productType'] as String,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      basePrice: json['basePrice'] as num? ?? 0,
      discountPercent: json['discountPercent'] as num? ?? 0,
      discountAmount: json['discountAmount'] as num? ?? 0,
      finalPrice: json['finalPrice'] as num? ?? 0,
      durationHours: (json['durationHours'] as num?)?.toInt(),
      durationDays: (json['durationDays'] as num?)?.toInt(),
    );
  }
}

class MonetizationPayment {
  const MonetizationPayment({
    required this.id,
    required this.status,
    required this.provider,
    required this.amount,
    this.paidAt,
  });

  final String id;
  final String status;
  final String provider;
  final num amount;
  final DateTime? paidAt;

  factory MonetizationPayment.fromJson(Map<String, dynamic> json) {
    return MonetizationPayment(
      id: json['id'] as String,
      status: json['status'] as String,
      provider: json['provider'] as String? ?? 'MANUAL',
      amount: json['amount'] as num? ?? 0,
      paidAt: _parseDate(json['paidAt']),
    );
  }
}

class MonetizationOrder {
  const MonetizationOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.subtotal,
    required this.discountAmount,
    required this.totalAmount,
    required this.currency,
    required this.createdAt,
    this.paidAt,
    required this.items,
    required this.payments,
  });

  final String id;
  final String orderNumber;
  final String status;
  final num subtotal;
  final num discountAmount;
  final num totalAmount;
  final String currency;
  final DateTime createdAt;
  final DateTime? paidAt;
  final List<MonetizationOrderItem> items;
  final List<MonetizationPayment> payments;

  factory MonetizationOrder.fromJson(Map<String, dynamic> json) {
    return MonetizationOrder(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      subtotal: json['subtotal'] as num? ?? 0,
      discountAmount: json['discountAmount'] as num? ?? 0,
      totalAmount: json['totalAmount'] as num? ?? 0,
      currency: json['currency'] as String? ?? 'KZT',
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      paidAt: _parseDate(json['paidAt']),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => MonetizationOrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      payments: (json['payments'] as List<dynamic>? ?? [])
          .map((e) => MonetizationPayment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MonetizationCampaignMetrics {
  const MonetizationCampaignMetrics({
    required this.servedCount,
    required this.qualifiedImpressions,
    required this.clickCount,
  });

  final int servedCount;
  final int qualifiedImpressions;
  final int clickCount;

  factory MonetizationCampaignMetrics.fromJson(Map<String, dynamic> json) {
    return MonetizationCampaignMetrics(
      servedCount: (json['servedCount'] as num?)?.toInt() ?? 0,
      qualifiedImpressions: (json['qualifiedImpressions'] as num?)?.toInt() ?? 0,
      clickCount: (json['clickCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class MonetizationCampaign {
  const MonetizationCampaign({
    required this.id,
    required this.businessId,
    this.businessTitle,
    required this.status,
    this.effectiveStatus,
    this.startAt,
    this.endAt,
    required this.productCode,
    required this.productName,
    required this.productType,
    this.creativeId,
    this.creativeModerationStatus,
    required this.placements,
    required this.metrics,
  });

  final String id;
  final String businessId;
  final String? businessTitle;
  final String status;
  final String? effectiveStatus;
  final DateTime? startAt;
  final DateTime? endAt;
  final String productCode;
  final String productName;
  final String productType;
  final String? creativeId;
  final String? creativeModerationStatus;
  final List<String> placements;
  final MonetizationCampaignMetrics metrics;

  String get displayStatus => effectiveStatus ?? status;

  factory MonetizationCampaign.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>? ?? {};
    final creative = json['creative'] as Map<String, dynamic>?;
    final placements = (json['placements'] as List<dynamic>? ?? [])
        .map((e) => (e as Map<String, dynamic>)['code'] as String? ?? '')
        .where((e) => e.isNotEmpty)
        .toList();
    return MonetizationCampaign(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      businessTitle: json['businessTitle'] as String?,
      status: json['status'] as String,
      effectiveStatus: json['effectiveStatus'] as String?,
      startAt: _parseDate(json['startAt']),
      endAt: _parseDate(json['endAt']),
      productCode: product['code'] as String? ?? '',
      productName: product['name'] as String? ?? '',
      productType: product['type'] as String? ?? '',
      creativeId: creative?['id'] as String?,
      creativeModerationStatus: creative?['moderationStatus'] as String?,
      placements: placements,
      metrics: MonetizationCampaignMetrics.fromJson(
        json['metrics'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class MonetizationCampaignAnalytics {
  const MonetizationCampaignAnalytics({
    required this.campaignId,
    required this.served,
    required this.qualifiedImpressions,
    required this.clicks,
    required this.ctr,
    required this.actions,
    this.periodFrom,
    this.periodTo,
  });

  final String campaignId;
  final int served;
  final int qualifiedImpressions;
  final int clicks;
  final num ctr;
  final Map<String, int> actions;
  final DateTime? periodFrom;
  final DateTime? periodTo;

  factory MonetizationCampaignAnalytics.fromJson(Map<String, dynamic> json) {
    final period = json['period'] as Map<String, dynamic>?;
    final actionsRaw = json['actions'] as Map<String, dynamic>? ?? {};
    return MonetizationCampaignAnalytics(
      campaignId: json['campaignId'] as String,
      served: (json['served'] as num?)?.toInt() ?? 0,
      qualifiedImpressions: (json['qualifiedImpressions'] as num?)?.toInt() ?? 0,
      clicks: (json['clicks'] as num?)?.toInt() ?? 0,
      ctr: json['ctr'] as num? ?? 0,
      actions: actionsRaw.map(
        (k, v) => MapEntry(k, (v as num?)?.toInt() ?? 0),
      ),
      periodFrom: _parseDate(period?['from']),
      periodTo: _parseDate(period?['to']),
    );
  }
}

class MonetizationCreative {
  const MonetizationCreative({
    required this.id,
    required this.businessId,
    required this.type,
    this.imageUrl,
    required this.title,
    this.description,
    this.buttonText,
    this.targetType,
    this.targetId,
    this.targetUrl,
    required this.moderationStatus,
    this.moderationComment,
  });

  final String id;
  final String businessId;
  final String type;
  final String? imageUrl;
  final String title;
  final String? description;
  final String? buttonText;
  final String? targetType;
  final String? targetId;
  final String? targetUrl;
  final String moderationStatus;
  final String? moderationComment;

  factory MonetizationCreative.fromJson(Map<String, dynamic> json) {
    return MonetizationCreative(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      type: json['type'] as String? ?? 'BANNER',
      imageUrl: json['imageUrl'] as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      buttonText: json['buttonText'] as String?,
      targetType: json['targetType'] as String?,
      targetId: json['targetId'] as String?,
      targetUrl: json['targetUrl'] as String?,
      moderationStatus: json['moderationStatus'] as String? ?? 'DRAFT',
      moderationComment: json['moderationComment'] as String?,
    );
  }
}

DateTime? _parseDate(Object? value) {
  if (value == null) return null;
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}
