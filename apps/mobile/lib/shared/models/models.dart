import '../utils/json_parse.dart';

class CategoryModel {
  CategoryModel({
    required this.id,
    required this.title,
    required this.slug,
    this.icon,
  });

  final String id;
  final String title;
  final String slug;
  final String? icon;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
    id: json['id'] as String,
    title: json['title'] as String,
    slug: json['slug'] as String,
    icon: json['icon'] as String?,
  );
}

class SubcategoryModel {
  SubcategoryModel({
    required this.id,
    required this.categoryId,
    required this.slug,
    required this.nameRu,
    required this.nameKk,
    this.icon,
    this.sortOrder = 0,
  });

  final String id;
  final String categoryId;
  final String slug;
  final String nameRu;
  final String nameKk;
  final String? icon;
  final int sortOrder;

  String displayName({String localeCode = 'ru'}) {
    if (localeCode.startsWith('kk')) return nameKk;
    return nameRu;
  }

  factory SubcategoryModel.fromJson(Map<String, dynamic> json) => SubcategoryModel(
        id: json['id'] as String,
        categoryId: json['categoryId'] as String,
        slug: json['slug'] as String,
        nameRu: json['nameRu'] as String,
        nameKk: json['nameKk'] as String,
        icon: json['icon'] as String?,
        sortOrder: json['sortOrder'] as int? ?? 0,
      );
}

class RecommendedBusiness {
  const RecommendedBusiness({
    required this.business,
    required this.reason,
  });

  final BusinessModel business;
  final String reason;
}

class BusinessModel {
  BusinessModel({
    required this.id,
    required this.title,
    required this.slug,
    required this.address,
    this.shortDesc,
    this.latitude,
    this.longitude,
    this.phone,
    this.whatsapp,
    this.coverImageUrl,
    this.isFeatured = false,
    this.planTier,
    this.featuredSlot,
    this.categoryTitle,
    this.categoryId,
    this.distanceMeters,
  });

  final String id;
  final String title;
  final String slug;
  final String address;
  final String? shortDesc;
  final double? latitude;
  final double? longitude;
  final String? phone;
  final String? whatsapp;
  final String? coverImageUrl;
  final bool isFeatured;
  final String? planTier;
  final int? featuredSlot;
  final String? categoryTitle;
  final String? categoryId;
  final int? distanceMeters;

  factory BusinessModel.fromJson(Map<String, dynamic> json) => BusinessModel(
    id: json['id'] as String,
    title: json['title'] as String,
    slug: json['slug'] as String,
    address: json['address'] as String,
    shortDesc: json['shortDesc'] as String?,
    latitude: parseJsonDouble(json['latitude']),
    longitude: parseJsonDouble(json['longitude']),
    phone: json['phone'] as String?,
    whatsapp: json['whatsapp'] as String?,
    coverImageUrl: json['coverImageUrl'] as String?,
    isFeatured: json['isFeatured'] as bool? ?? false,
    planTier: json['planTier'] as String?,
    featuredSlot: parseJsonInt(json['featuredSlot']),
    categoryTitle:
        (json['category'] as Map<String, dynamic>?)?['title'] as String?,
    categoryId:
        json['categoryId'] as String? ??
        (json['category'] as Map<String, dynamic>?)?['id'] as String?,
    distanceMeters: parseJsonInt(json['distanceMeters']),
  );

  bool get isTopCity => false;

  bool get isVipPro => planTier == 'VIP';

  /// Paid subscription must not appear as a quality badge to consumers (Stage 6.4).
  String? get planBadgeLabel => null;

  /// Maps legacy API/cache tier strings to Stage 4C tiers.
  /// PRO → PREMIUM and TOP_CITY → VIP remain for stale client payloads only;
  /// backend is source of truth and never emits these values post-migration.
  static String normalizePlanTier(String? tier) {
    switch (tier) {
      case 'FREE':
      case 'BASIC':
      case 'PREMIUM':
      case 'VIP':
        return tier!;
      case 'PRO':
        return 'PREMIUM';
      case 'TOP_CITY':
        return 'VIP';
      default:
        assert(() {
          // ignore: avoid_print
          print('Unknown planTier "$tier", fallback to FREE');
          return true;
        }());
        return 'FREE';
    }
  }
}

class UserModel {
  UserModel({
    required this.id,
    this.phone,
    this.email,
    this.name,
    this.avatarUrl,
    required this.role,
    this.preferredCityId,
    this.preferredCitySlug,
    this.preferredCityName,
    this.managedCityId,
    this.managedCitySlug,
    this.managedCityName,
  });

  final String id;
  final String? phone;
  final String? email;
  final String? name;
  final String? avatarUrl;
  final String role;
  final String? preferredCityId;
  final String? preferredCitySlug;
  final String? preferredCityName;
  final String? managedCityId;
  final String? managedCitySlug;
  final String? managedCityName;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final preferredCity = json['preferredCity'] as Map<String, dynamic>?;
    final managedCity = json['managedCity'] as Map<String, dynamic>?;
    return UserModel(
      id: json['id'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String,
      preferredCityId: json['preferredCityId'] as String? ?? preferredCity?['id'] as String?,
      preferredCitySlug: preferredCity?['slug'] as String?,
      preferredCityName: preferredCity?['nameRu'] as String?,
      managedCityId: json['managedCityId'] as String? ?? managedCity?['id'] as String?,
      managedCitySlug: managedCity?['slug'] as String?,
      managedCityName: managedCity?['nameRu'] as String?,
    );
  }

  UserModel copyWith({
    String? name,
    String? avatarUrl,
    bool clearAvatar = false,
    String? preferredCityId,
    String? preferredCitySlug,
    String? preferredCityName,
    String? managedCityId,
    String? managedCitySlug,
    String? managedCityName,
  }) {
    return UserModel(
      id: id,
      phone: phone,
      email: email,
      name: name ?? this.name,
      avatarUrl: clearAvatar ? null : (avatarUrl ?? this.avatarUrl),
      role: role,
      preferredCityId: preferredCityId ?? this.preferredCityId,
      preferredCitySlug: preferredCitySlug ?? this.preferredCitySlug,
      preferredCityName: preferredCityName ?? this.preferredCityName,
      managedCityId: managedCityId ?? this.managedCityId,
      managedCitySlug: managedCitySlug ?? this.managedCitySlug,
      managedCityName: managedCityName ?? this.managedCityName,
    );
  }
}

class PaginatedBusinesses {
  PaginatedBusinesses({required this.items, required this.total});

  final List<BusinessModel> items;
  final int total;

  factory PaginatedBusinesses.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>)
        .map((e) => BusinessModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = json['meta'] as Map<String, dynamic>? ?? {};
    return PaginatedBusinesses(
      items: items,
      total: parseJsonInt(meta['total']) ?? items.length,
    );
  }
}

class PromotionModel {
  PromotionModel({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.discountText,
    this.status,
    this.startDate,
    this.endDate,
    this.businessId,
    this.business,
  });

  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? discountText;
  final String? status;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? businessId;
  final BusinessModel? business;

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    final businessJson = json['business'] as Map<String, dynamic>?;
    return PromotionModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      discountText: json['discountText'] as String?,
      status: json['status'] as String?,
      startDate: _parseDate(json['startDate']),
      endDate: _parseDate(json['endDate']),
      businessId: json['businessId'] as String? ?? businessJson?['id'] as String?,
      business: businessJson != null
          ? BusinessModel.fromJson(businessJson)
          : null,
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

class PaginatedPromotions {
  PaginatedPromotions({required this.items});

  final List<PromotionModel> items;

  factory PaginatedPromotions.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>)
        .map((e) => PromotionModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return PaginatedPromotions(items: items);
  }
}

class ReviewModel {
  ReviewModel({
    required this.id,
    required this.rating,
    this.text,
    this.ownerReply,
    this.userName,
    this.businessId,
    this.businessTitle,
    required this.createdAt,
  });

  final String id;
  final int rating;
  final String? text;
  final String? ownerReply;
  final String? userName;
  final String? businessId;
  final String? businessTitle;
  final String createdAt;

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    final business = json['business'] as Map<String, dynamic>?;
    return ReviewModel(
      id: json['id'] as String,
      rating: json['rating'] as int,
      text: json['text'] as String?,
      ownerReply: json['ownerReply'] as String?,
      userName: user?['name'] as String? ?? 'Пользователь',
      businessId: business?['id'] as String? ?? json['businessId'] as String?,
      businessTitle: business?['title'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}
