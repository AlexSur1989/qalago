import 'package:dio/dio.dart';
import '../../../shared/models/models.dart';

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
        'limit': limit ?? 50,
      },
    );
    return PaginatedBusinesses.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> fetchMyBusinesses() async {
    final response = await _dio.get('/businesses/my');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> fetchBusinessDetails(String id) async {
    final response = await _dio.get('/businesses/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<void> trackBusinessView(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'VIEW_BUSINESS');

  Future<void> trackCallClick(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'CALL_CLICK');

  Future<void> trackWhatsappClick(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'WHATSAPP_CLICK');

  Future<void> trackRouteClick(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'ROUTE_CLICK');

  Future<void> trackFavoriteAdd(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'FAVORITE_ADD');

  Future<void> trackFavoriteRemove(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'FAVORITE_REMOVE');

  Future<void> trackPromotionView(String businessId) =>
      _trackAnalyticsEvent(businessId: businessId, type: 'PROMOTION_VIEW');

  Future<void> _trackAnalyticsEvent({
    required String businessId,
    required String type,
  }) async {
    try {
      await _dio.post(
        '/analytics/events',
        data: {'businessId': businessId, 'type': type},
      );
    } on DioException {
      // Analytics must never block a user action.
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

  Future<void> createBusiness(Map<String, dynamic> data) async {
    await _dio.post('/businesses', data: data);
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
