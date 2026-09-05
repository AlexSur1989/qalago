/// Consumer discovery helpers — promotions, favorites, map (Stage 5D).
library;

import 'package:geolocator/geolocator.dart';

import '../../core/location/user_location_provider.dart';
import '../models/models.dart';

/// City slug from a favorites API row (`business.city.slug`).
String? favoriteBusinessCitySlug(Map<String, dynamic> favorite) {
  final business = favorite['business'];
  if (business is! Map) return null;
  final city = business['city'];
  if (city is! Map) return null;
  return city['slug'] as String?;
}

/// Filters favorites to the selected city without mutating stored favorites.
List<Map<String, dynamic>> filterFavoritesByCity(
  List<Map<String, dynamic>> favorites,
  String citySlug,
) {
  return favorites
      .where((item) => favoriteBusinessCitySlug(item) == citySlug)
      .toList();
}

enum FavoriteSortMode { recent, name }

List<Map<String, dynamic>> sortFavorites(
  List<Map<String, dynamic>> favorites,
  FavoriteSortMode mode,
) {
  final sorted = List<Map<String, dynamic>>.from(favorites);
  if (mode == FavoriteSortMode.name) {
    sorted.sort((a, b) {
      final aTitle =
          (a['business'] as Map<String, dynamic>?)?['title'] as String? ?? '';
      final bTitle =
          (b['business'] as Map<String, dynamic>?)?['title'] as String? ?? '';
      return aTitle.compareTo(bTitle);
    });
  }
  // recent: preserve API order (createdAt desc).
  return sorted;
}

List<PromotionModel> filterActivePromotionModels(List<PromotionModel> items) {
  final now = DateTime.now().toUtc();
  return items.where((promotion) {
    if (promotion.endDate != null &&
        promotion.endDate!.toUtc().isBefore(now)) {
      return false;
    }
    if (promotion.startDate != null &&
        promotion.startDate!.toUtc().isAfter(now)) {
      return false;
    }
    return true;
  }).toList();
}

String formatPromotionValidity(PromotionModel promotion) {
  final end = promotion.endDate;
  if (end != null) {
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];
    final local = end.toLocal();
    return 'До ${local.day} ${months[local.month - 1]}';
  }
  return 'Активно сейчас';
}

List<BusinessModel> businessesWithCoordinates(List<BusinessModel> items) {
  return items
      .where((b) => b.latitude != null && b.longitude != null)
      .toList();
}

/// Map camera center: user GPS when reasonably near selected city, else city center.
({double lat, double lng}) mapInitialCenter({
  required double? cityCenterLat,
  required double? cityCenterLng,
  required double? userLat,
  required double? userLng,
}) {
  if (userLat != null &&
      userLng != null &&
      cityCenterLat != null &&
      cityCenterLng != null) {
    final distance = Geolocator.distanceBetween(
      userLat,
      userLng,
      cityCenterLat,
      cityCenterLng,
    );
    if (distance <= maxUserDistanceFromCityMeters) {
      return (lat: userLat, lng: userLng);
    }
  }

  if (cityCenterLat != null && cityCenterLng != null) {
    return (lat: cityCenterLat, lng: cityCenterLng);
  }

  if (userLat != null && userLng != null) {
    return (lat: userLat, lng: userLng);
  }

  return (lat: 51.2278, lng: 51.3865);
}

int? distanceMetersToBusiness({
  required double? userLat,
  required double? userLng,
  required BusinessModel business,
}) {
  if (userLat == null ||
      userLng == null ||
      business.latitude == null ||
      business.longitude == null) {
    return business.distanceMeters;
  }
  return Geolocator.distanceBetween(
    userLat,
    userLng,
    business.latitude!,
    business.longitude!,
  ).round();
}

BusinessModel businessWithDistance(
  BusinessModel business, {
  required double? userLat,
  required double? userLng,
}) {
  final meters = distanceMetersToBusiness(
    userLat: userLat,
    userLng: userLng,
    business: business,
  );
  if (meters == null || meters == business.distanceMeters) return business;
  return BusinessModel(
    id: business.id,
    title: business.title,
    slug: business.slug,
    address: business.address,
    shortDesc: business.shortDesc,
    latitude: business.latitude,
    longitude: business.longitude,
    phone: business.phone,
    whatsapp: business.whatsapp,
    coverImageUrl: business.coverImageUrl,
    isFeatured: business.isFeatured,
    planTier: business.planTier,
    featuredSlot: business.featuredSlot,
    categoryTitle: business.categoryTitle,
    categoryId: business.categoryId,
    distanceMeters: meters,
  );
}
