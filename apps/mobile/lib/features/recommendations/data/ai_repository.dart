import 'package:dio/dio.dart';

class RecommendationItemModel {
  const RecommendationItemModel({
    required this.businessId,
    required this.reason,
  });

  final String businessId;
  final String reason;

  factory RecommendationItemModel.fromJson(Map<String, dynamic> json) =>
      RecommendationItemModel(
        businessId: json['businessId'] as String,
        reason: json['reason'] as String? ?? '',
      );
}

class AiRepository {
  AiRepository(this._dio);

  final Dio _dio;

  Future<List<RecommendationItemModel>> fetchRecommendations({
    required String citySlug,
    int limit = 10,
  }) async {
    final response = await _dio.post(
      '/recommendations',
      data: {'citySlug': citySlug, 'limit': limit},
    );
    final data = response.data as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((e) => RecommendationItemModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
