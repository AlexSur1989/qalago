import 'package:dio/dio.dart';

class OnboardingRepository {
  OnboardingRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchMyApplications() async {
    final response = await _dio.get('/business-applications/my');
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getApplication(String id) async {
    final response = await _dio.get('/business-applications/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createApplication(Map<String, dynamic> data) async {
    final response = await _dio.post('/business-applications', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateApplication(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.patch('/business-applications/$id', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> submitApplication(String id) async {
    final response = await _dio.post('/business-applications/$id/submit');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancelApplication(String id) async {
    final response = await _dio.post('/business-applications/$id/cancel');
    return response.data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchMyClaims() async {
    final response = await _dio.get('/ownership-claims/my');
    final data = response.data as Map<String, dynamic>;
    return (data['items'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createClaim(
    String businessId, {
    String? claimantMessage,
  }) async {
    final response = await _dio.post(
      '/businesses/$businessId/ownership-claims',
      data: {
        if (claimantMessage != null && claimantMessage.trim().isNotEmpty)
          'claimantMessage': claimantMessage.trim(),
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancelClaim(String id) async {
    final response = await _dio.post('/ownership-claims/$id/cancel');
    return response.data as Map<String, dynamic>;
  }
}
