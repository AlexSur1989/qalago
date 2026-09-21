import '../../core/locale/localized_content.dart';

class BusinessBranchLocation {
  const BusinessBranchLocation({
    required this.id,
    required this.businessId,
    required this.cityId,
    required this.citySlug,
    required this.cityNameRu,
    required this.cityNameKk,
    required this.address,
    required this.isPrimary,
    this.latitude,
    this.longitude,
    this.workHours,
    this.phone,
    this.whatsapp,
    this.instagram,
    this.website,
  });

  final String id;
  final String businessId;
  final String cityId;
  final String citySlug;
  final String cityNameRu;
  final String cityNameKk;
  final String address;
  final bool isPrimary;
  final double? latitude;
  final double? longitude;
  final Map<String, dynamic>? workHours;
  final String? phone;
  final String? whatsapp;
  final String? instagram;
  final String? website;

  String displayCityName({required String localeCode}) {
    return cityDisplayName(
      localeCode: localeCode,
      nameRu: cityNameRu,
      nameKk: cityNameKk,
    );
  }

  factory BusinessBranchLocation.fromJson(Map<String, dynamic> json) {
    final city = json['city'] as Map<String, dynamic>? ?? {};
    return BusinessBranchLocation(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      cityId: json['cityId'] as String,
      citySlug: city['slug'] as String? ?? '',
      cityNameRu: city['nameRu'] as String? ?? '',
      cityNameKk: city['nameKk'] as String? ?? '',
      address: json['address'] as String? ?? '',
      isPrimary: json['isPrimary'] as bool? ?? false,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      workHours: json['workHours'] as Map<String, dynamic>?,
      phone: json['phone'] as String?,
      whatsapp: json['whatsapp'] as String?,
      instagram: json['instagram'] as String?,
      website: json['website'] as String?,
    );
  }
}
