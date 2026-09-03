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

class ModerationAnalysisModel {
  const ModerationAnalysisModel({
    required this.score,
    required this.suggestedAction,
    required this.flags,
  });

  final int score;
  final String suggestedAction;
  final List<ModerationFlagModel> flags;

  factory ModerationAnalysisModel.fromJson(Map<String, dynamic> json) =>
      ModerationAnalysisModel(
        score: json['score'] as int? ?? 0,
        suggestedAction: json['suggestedAction'] as String? ?? 'review',
        flags: (json['flags'] as List<dynamic>? ?? const [])
            .map((e) => ModerationFlagModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ModerationFlagModel {
  const ModerationFlagModel({
    required this.code,
    required this.message,
    required this.severity,
  });

  final String code;
  final String message;
  final String severity;

  factory ModerationFlagModel.fromJson(Map<String, dynamic> json) =>
      ModerationFlagModel(
        code: json['code'] as String? ?? '',
        message: json['message'] as String? ?? '',
        severity: json['severity'] as String? ?? 'low',
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

  Future<ModerationAnalysisModel?> analyzeModeration({
    required String text,
    required int rating,
  }) async {
    if (text.trim().length < 3) return null;

    try {
      final response = await _dio.post(
        '/moderation/analyze',
        data: {'text': text, 'rating': rating},
      );
      return ModerationAnalysisModel.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on DioException {
      return null;
    }
  }
}
