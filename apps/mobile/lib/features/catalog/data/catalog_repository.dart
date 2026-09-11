import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/rbac/business_access.dart';
import '../../../features/ads/data/ad_models.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/utils/audience_distance_bucket.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> sendCode(String phone) async {
    final response = await _dio.post('/auth/send-code', data: {'phone': phone});
    return response.data as Map<String, dynamic>;
  }

  Future<({String token, UserModel user})> verifyCode({
    required String phone,
    required String code,
    String? name,
    String? accountType,
  }) async {
    final response = await _dio.post(
      '/auth/verify-code',
      data: {
        'phone': phone,
        'code': code,
        if (name != null) 'name': name,
        if (accountType != null) 'accountType': accountType,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return (
      token: data['accessToken'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<({String token, UserModel user})> devLogin(String phone) async {
    final response = await _dio.post('/auth/dev-login', data: {'phone': phone});
    final data = response.data as Map<String, dynamic>;
    return (
      token: data['accessToken'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<({String token, UserModel user})> signInWithGoogle(String idToken) async {
    final response = await _dio.post('/auth/google', data: {'idToken': idToken});
    final data = response.data as Map<String, dynamic>;
    return (
      token: data['accessToken'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<({String token, UserModel user})> signInWithApple(
    String identityToken,
  ) async {
    final response = await _dio.post(
      '/auth/apple',
      data: {'identityToken': identityToken},
    );
    final data = response.data as Map<String, dynamic>;
    return (
      token: data['accessToken'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<UserModel> getMe() async {
    final response = await _dio.get('/users/me');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> updateMe({String? name, String? preferredCityId}) async {
    final response = await _dio.patch(
      '/users/me',
      data: {
        if (name != null) 'name': name,
        if (preferredCityId != null) 'preferredCityId': preferredCityId,
      },
    );
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> deleteAccount() async {
    final response = await _dio.delete('/users/me');
    return response.data as Map<String, dynamic>;
  }
}

class CatalogRepository {
  CatalogRepository(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchCities() async {
    final response = await _dio.get('/cities');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<CategoryModel>> fetchCategories({String? citySlug}) async {
    final response = await _dio.get(
      '/categories',
      queryParameters: {
        if (citySlug != null && citySlug.isNotEmpty) 'citySlug': citySlug,
      },
    );
    return (response.data as List<dynamic>)
        .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PaginatedBusinesses> fetchBusinesses({
    required String citySlug,
    String? search,
    String? categoryId,
    bool? featured,
    double? latitude,
    double? longitude,
    double? radiusKm,
    int? limit,
    String? sort,
  }) async {
    final response = await _dio.get(
      '/businesses',
      queryParameters: {
        'citySlug': citySlug,
        if (search != null && search.isNotEmpty) 'search': search,
        if (categoryId != null) 'categoryId': categoryId,
        if (featured == true) 'featured': 'true',
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (radiusKm != null) 'radiusKm': radiusKm,
        if (sort != null && sort.isNotEmpty) 'sort': sort,
        'limit': limit ?? 50,
      },
    );
    return PaginatedBusinesses.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<MyBusinessEntry>> fetchMyBusinesses() async {
    final response = await _dio.get('/businesses/my');
    final data = response.data as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => MyBusinessEntry.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> fetchBusinessDetails(String id) async {
    final response = await _dio.get('/businesses/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchBusinessCatalog(
    String businessId, {
    int page = 1,
    int limit = 20,
    String? sectionId,
    String? search,
  }) async {
    final response = await _dio.get(
      '/businesses/$businessId/catalog',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (sectionId != null && sectionId.isNotEmpty) 'sectionId': sectionId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchBusinessPhotos(
    String businessId, {
    int page = 1,
    int limit = 24,
  }) async {
    final response = await _dio.get(
      '/businesses/$businessId/photos',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> trackBusinessView(
    String businessId, {
    BusinessTrafficSource? trafficSource,
    String? searchQuery,
    AudienceDistanceBucket? audienceDistanceBucket,
    String? discoverySurface,
    String? visitorId,
    String? sessionId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'VIEW_BUSINESS',
        trafficSource: trafficSource?.apiValue,
        searchQuery: trafficSource == BusinessTrafficSource.search
            ? searchQuery
            : null,
        audienceDistanceBucket: audienceDistanceBucket?.apiValue,
        discoverySurface: discoverySurface ?? 'BUSINESS_DETAIL',
        visitorId: visitorId,
        sessionId: sessionId,
      );

  Future<void> trackBusinessImpression(
    String businessId, {
    required BusinessTrafficSource trafficSource,
    String? discoverySurface,
    String? searchQuery,
    AudienceDistanceBucket? audienceDistanceBucket,
    int? position,
    String? visitorId,
    String? sessionId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: trafficSource == BusinessTrafficSource.search
            ? 'SEARCH_RESULT_IMPRESSION'
            : 'BUSINESS_IMPRESSION',
        trafficSource: trafficSource.apiValue,
        discoverySurface: discoverySurface,
        searchQuery: trafficSource == BusinessTrafficSource.search
            ? searchQuery
            : null,
        audienceDistanceBucket: audienceDistanceBucket?.apiValue,
        position: position,
        visitorId: visitorId,
        sessionId: sessionId,
      );

  Future<void> trackSearchPerformed({
    required String cityId,
    required String searchQuery,
    String? visitorId,
    String? sessionId,
  }) =>
      _trackAnalyticsEvent(
        cityId: cityId,
        type: 'SEARCH_PERFORMED',
        searchQuery: searchQuery,
        visitorId: visitorId,
        sessionId: sessionId,
      );

  Future<void> trackCallClick(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'CALL_CLICK',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackWhatsappClick(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'WHATSAPP_CLICK',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackRouteClick(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'ROUTE_CLICK',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackWebsiteClick(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'WEBSITE_CLICK',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackInstagramClick(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'INSTAGRAM_CLICK',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackFavoriteAdd(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'FAVORITE_ADD',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackFavoriteRemove(String businessId, {String? sessionId, String? visitorId}) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'FAVORITE_REMOVE',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackPromotionView(
    String businessId, {
    String? promotionId,
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'PROMOTION_VIEW',
        promotionId: promotionId,
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackPromotionImpression(
    String businessId, {
    required String promotionId,
    String? discoverySurface,
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'PROMOTION_IMPRESSION',
        promotionId: promotionId,
        discoverySurface: discoverySurface,
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackCatalogItemView(
    String businessId, {
    required String catalogItemId,
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'CATALOG_ITEM_VIEW',
        catalogItemId: catalogItemId,
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackCatalogItemImpression(
    String businessId, {
    required String catalogItemId,
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'CATALOG_ITEM_IMPRESSION',
        catalogItemId: catalogItemId,
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackReviewsView(
    String businessId, {
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'REVIEWS_VIEW',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> trackReviewCreated(
    String businessId, {
    String? sessionId,
    String? visitorId,
  }) =>
      _trackAnalyticsEvent(
        businessId: businessId,
        type: 'REVIEW_CREATED',
        sessionId: sessionId,
        visitorId: visitorId,
      );

  Future<void> _trackAnalyticsEvent({
    String? businessId,
    String? cityId,
    required String type,
    String? trafficSource,
    String? discoverySurface,
    String? searchQuery,
    String? audienceDistanceBucket,
    String? promotionId,
    String? catalogItemId,
    int? position,
    String? visitorId,
    String? sessionId,
  }) async {
    try {
      final clientEventId = _newClientEventId();
      await _dio.post(
        '/analytics/events',
        data: {
          if (businessId != null) 'businessId': businessId,
          if (cityId != null) 'cityId': cityId,
          'type': type,
          'clientEventId': clientEventId,
          if (trafficSource != null) 'trafficSource': trafficSource,
          if (discoverySurface != null) 'discoverySurface': discoverySurface,
          if (searchQuery != null && searchQuery.trim().isNotEmpty)
            'searchQuery': searchQuery.trim(),
          if (audienceDistanceBucket != null)
            'audienceDistanceBucket': audienceDistanceBucket,
          if (promotionId != null) 'promotionId': promotionId,
          if (catalogItemId != null) 'catalogItemId': catalogItemId,
          if (position != null) 'position': position,
          if (visitorId != null) 'visitorId': visitorId,
          if (sessionId != null) 'sessionId': sessionId,
          'platform': _analyticsPlatform(),
        },
      );
    } on DioException {
      // Analytics must never block a user action.
    }
  }

  String _newClientEventId() {
    final now = DateTime.now().microsecondsSinceEpoch;
    return '$now-${identityHashCode(this)}';
  }

  String _analyticsPlatform() {
    if (kIsWeb) return 'WEB';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'IOS';
      case TargetPlatform.android:
        return 'ANDROID';
      default:
        return 'UNKNOWN';
    }
  }

  Future<List<Map<String, dynamic>>> fetchServiceItems(
    String businessId,
  ) async {
    final response = await _dio.get(
      '/service-items',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchServiceMenu(String businessId) async {
    final response = await _dio.get(
      '/service-menu',
      queryParameters: {'businessId': businessId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchServiceMenuManage(String businessId) async {
    final response = await _dio.get('/service-menu/manage/$businessId');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchManageMenuItems(
    String businessId, {
    int page = 1,
    int limit = 20,
    String? sectionId,
    String? search,
  }) async {
    final response = await _dio.get(
      '/service-menu/manage/$businessId/items',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (sectionId != null && sectionId.isNotEmpty) 'sectionId': sectionId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createServiceMenuGroup(
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post('/service-menu-groups', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<void> updateServiceMenuGroup(
    String id,
    Map<String, dynamic> data,
  ) async {
    await _dio.patch('/service-menu-groups/$id', data: data);
  }

  Future<void> deleteServiceMenuGroup(String id) async {
    await _dio.delete('/service-menu-groups/$id');
  }

  Future<List<Map<String, dynamic>>> fetchServiceItemsManage(
    String businessId,
  ) async {
    final response = await _dio.get('/service-items/manage/$businessId');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> createServiceItem(Map<String, dynamic> data) async {
    await _dio.post('/service-items', data: data);
  }

  Future<void> updateServiceItem(String id, Map<String, dynamic> data) async {
    await _dio.patch('/service-items/$id', data: data);
  }

  Future<void> deleteServiceItem(String id) async {
    await _dio.delete('/service-items/$id');
  }

  Future<void> updateBusiness(String id, Map<String, dynamic> data) async {
    await _dio.patch('/businesses/$id', data: data);
  }

  Future<PaginatedPromotions> fetchPromotions({
    required String citySlug,
    bool activeNow = true,
  }) async {
    final response = await _dio.get(
      '/promotions',
      queryParameters: {
        'citySlug': citySlug,
        if (activeNow) 'activeNow': 'true',
        'limit': 50,
      },
    );
    return PaginatedPromotions.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<ReviewModel>> fetchReviews(String businessId) async {
    final response = await _dio.get(
      '/reviews',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>)
        .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ReviewModel>> fetchMyReviews() async {
    final response = await _dio.get('/reviews/me');
    return (response.data as List<dynamic>)
        .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createReview({
    required String businessId,
    required int rating,
    String? text,
  }) async {
    await _dio.post(
      '/reviews',
      data: {
        'businessId': businessId,
        'rating': rating,
        if (text != null && text.isNotEmpty) 'text': text,
      },
    );
  }

  Future<void> replyReview(String reviewId, String ownerReply) async {
    await _dio.patch(
      '/reviews/$reviewId/reply',
      data: {'ownerReply': ownerReply},
    );
  }

  Future<void> createPromotion(Map<String, dynamic> data) async {
    await _dio.post('/promotions', data: data);
  }

  Future<List<PromotionModel>> fetchBusinessPromotions(String businessId) async {
    final response = await _dio.get(
      '/promotions',
      queryParameters: {'businessId': businessId, 'limit': 50},
    );
    return PaginatedPromotions.fromJson(response.data as Map<String, dynamic>).items;
  }

  Future<void> updatePromotion(String id, Map<String, dynamic> data) async {
    await _dio.patch('/promotions/$id', data: data);
  }

  Future<void> deletePromotion(String id) async {
    await _dio.delete('/promotions/$id');
  }

  Future<String> uploadImage(
    String filePath,
    List<int> bytes,
    String filename,
  ) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });
    final response = await _dio.post(
      '/uploads',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    return (response.data as Map<String, dynamic>)['url'] as String;
  }

  Future<void> attachBusinessImage({
    required String businessId,
    required String imageUrl,
    bool asCover = true,
  }) async {
    await _dio.post(
      '/uploads/business/$businessId',
      data: {'imageUrl': imageUrl, 'asCover': asCover},
    );
  }

  Future<List<Map<String, dynamic>>> fetchBusinessImages(String businessId) async {
    final response = await _dio.get('/uploads/business/$businessId/images');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> deleteBusinessImage(String businessId, String imageId) async {
    await _dio.delete('/uploads/business/$businessId/images/$imageId');
  }

  Future<void> setBusinessCover(String businessId, String imageId) async {
    await _dio.patch('/uploads/business/$businessId/images/$imageId/cover');
  }

  Future<Map<String, dynamic>> fetchAnalyticsDashboard(
    String businessId, {
    int days = 30,
  }) async {
    final response = await _dio.get(
      '/analytics/business/$businessId/dashboard',
      queryParameters: {'days': days},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<({List<int> bytes, String filename})> fetchAnalyticsExport(
    String businessId, {
    int days = 30,
  }) async {
    final response = await _dio.get<List<int>>(
      '/analytics/business/$businessId/export',
      queryParameters: {'days': days},
      options: Options(responseType: ResponseType.bytes),
    );
    final disposition = response.headers.value('content-disposition') ?? '';
    final utf8Match = RegExp(r"filename\*=UTF-8''([^;]+)", caseSensitive: false)
        .firstMatch(disposition);
    final asciiMatch =
        RegExp(r'filename="([^"]+)"').firstMatch(disposition);
    final filename = utf8Match != null
        ? Uri.decodeComponent(utf8Match.group(1)!)
        : asciiMatch?.group(1) ?? 'qalago-analytics-$businessId.csv';
    return (bytes: response.data ?? <int>[], filename: filename);
  }

  Future<Map<String, dynamic>> fetchAnalyticsSummary(
    String businessId, {
    int days = 30,
  }) async {
    final response = await _dio.get(
      '/analytics/business/$businessId/summary',
      queryParameters: {'days': days},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchAnalyticsTrends(
    String businessId, {
    int days = 30,
  }) async {
    final response = await _dio.get(
      '/analytics/business/$businessId/trends',
      queryParameters: {'days': days},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchPlans() async {
    final response = await _dio.get('/plans');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchBusinessPlan(String businessId) async {
    final response = await _dio.get('/businesses/$businessId/plan');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> mockPlanCheckout(
    String businessId,
    String tier,
  ) async {
    final response = await _dio.post(
      '/businesses/$businessId/plan/mock-checkout',
      data: {'tier': tier},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<AdServeResponse?> serveAds({
    required String placementCode,
    required String sessionId,
    required String citySlug,
    String? categoryId,
  }) async {
    try {
      final response = await _dio.get(
        '/monetization/ads/serve',
        queryParameters: {
          'placementCode': placementCode,
          'sessionId': sessionId,
          'citySlug': citySlug,
          if (categoryId != null) 'categoryId': categoryId,
        },
      );
      return AdServeResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException {
      return null;
    }
  }

  /// Best-effort ad event. Returns true if request completed (incl. duplicate).
  Future<bool> sendAdEvent({
    required String campaignId,
    required String placementCode,
    required String sessionId,
    required String type,
    int? position,
  }) async {
    try {
      await _dio.post(
        '/monetization/ads/events',
        data: {
          'campaignId': campaignId,
          'placementCode': placementCode,
          'sessionId': sessionId,
          'type': type,
          if (position != null) 'position': position,
        },
      );
      return true;
    } on DioException {
      return false;
    }
  }

  // --- Owner monetization (Stage 4A) ---

  Future<List<Map<String, dynamic>>> fetchMonetizationProducts({
    required String businessId,
    String? citySlug,
    String? categoryId,
  }) async {
    final response = await _dio.get(
      '/monetization/products',
      queryParameters: {
        'businessId': businessId,
        if (citySlug != null) 'citySlug': citySlug,
        if (categoryId != null) 'categoryId': categoryId,
      },
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchMonetizationProduct({
    required String code,
    required String businessId,
    String? citySlug,
    String? categoryId,
  }) async {
    final response = await _dio.get(
      '/monetization/products/$code',
      queryParameters: {
        'businessId': businessId,
        if (citySlug != null) 'citySlug': citySlug,
        if (categoryId != null) 'categoryId': categoryId,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMonetizationPackages() async {
    final response = await _dio.get('/monetization/packages');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchMonetizationQuote(
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.post('/monetization/quote', data: body);
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMonetizationPurchaseStates(
    String businessId,
  ) async {
    final response = await _dio.get(
      '/monetization/purchase-states',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createMonetizationOrder(
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.post('/monetization/orders', data: body);
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMonetizationOrders(
    String businessId,
  ) async {
    final response = await _dio.get(
      '/monetization/orders',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchMonetizationOrder(String orderId) async {
    final response = await _dio.get('/monetization/orders/$orderId');
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMonetizationCampaigns(
    String businessId,
  ) async {
    final response = await _dio.get(
      '/monetization/campaigns',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchMonetizationCampaign(String id) async {
    final response = await _dio.get('/monetization/campaigns/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchCampaignAnalytics(
    String campaignId, {
    String? from,
    String? to,
  }) async {
    final response = await _dio.get(
      '/monetization/campaigns/$campaignId/analytics',
      queryParameters: {
        if (from != null) 'from': from,
        if (to != null) 'to': to,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createMonetizationCreative(
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.post('/monetization/creatives', data: body);
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMonetizationCreatives(
    String businessId,
  ) async {
    final response = await _dio.get(
      '/monetization/creatives',
      queryParameters: {'businessId': businessId},
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> updateMonetizationCreative(
    String id,
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.patch('/monetization/creatives/$id', data: body);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchTeam(String businessId) async {
    final response = await _dio.get('/businesses/$businessId/team');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> inviteTeamMember({
    required String businessId,
    required String email,
    required List<String> permissions,
  }) async {
    final response = await _dio.post(
      '/businesses/$businessId/team/invite',
      data: {
        'email': email,
        'permissions': permissions,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateTeamMember({
    required String businessId,
    required String membershipId,
    List<String>? permissions,
    String? status,
  }) async {
    final response = await _dio.patch(
      '/businesses/$businessId/team/$membershipId',
      data: {
        if (permissions != null) 'permissions': permissions,
        if (status != null) 'status': status,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> revokeTeamInvitation({
    required String businessId,
    required String invitationId,
  }) async {
    await _dio.delete(
      '/businesses/$businessId/team/invitations/$invitationId',
    );
  }

  Future<Map<String, dynamic>> resolveInvitation(String token) async {
    final response = await _dio.post(
      '/invitations/resolve',
      data: {'token': token},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> acceptInvitation(String token) async {
    final response = await _dio.post(
      '/invitations/accept',
      data: {'token': token},
    );
    return response.data as Map<String, dynamic>;
  }
}

class FavoritesRepository {
  FavoritesRepository(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchFavorites() async {
    final response = await _dio.get('/favorites');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<bool> isFavorite(String businessId) async {
    final response = await _dio.get('/favorites/check/$businessId');
    return (response.data as Map<String, dynamic>)['isFavorite'] as bool? ??
        false;
  }

  Future<void> add(String businessId) async {
    await _dio.post('/favorites', data: {'businessId': businessId});
  }

  Future<void> remove(String businessId) async {
    await _dio.delete('/favorites/$businessId');
  }
}

class AdminRepository {
  AdminRepository(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchBusinesses({
    String? status,
    required String citySlug,
  }) async {
    final response = await _dio.get(
      '/admin/businesses',
      queryParameters: {
        'citySlug': citySlug,
        if (status != null) 'status': status,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return (data['items'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> updateBusinessStatus(String id, String status) async {
    await _dio.patch('/admin/businesses/$id/status', data: {'status': status});
  }

  Future<void> setFeatured(String id, bool isFeatured) async {
    await _dio.patch(
      '/admin/businesses/$id/featured',
      data: {'isFeatured': isFeatured},
    );
  }
}

class NotificationsRepository {
  NotificationsRepository(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchAll() async {
    final response = await _dio.get('/notifications');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<int> unreadCount() async {
    final response = await _dio.get('/notifications/unread-count');
    return (response.data as Map<String, dynamic>)['count'] as int? ?? 0;
  }

  Future<void> markAllRead() async {
    await _dio.patch('/notifications/read-all');
  }

  Future<void> markRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }
}
