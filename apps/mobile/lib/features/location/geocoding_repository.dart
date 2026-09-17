import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_provider.dart';

class GeocodingSuggestion {
  const GeocodingSuggestion({
    required this.id,
    required this.label,
    required this.address,
    required this.latitude,
    required this.longitude,
  });

  final String id;
  final String label;
  final String address;
  final double latitude;
  final double longitude;

  factory GeocodingSuggestion.fromJson(Map<String, dynamic> json) {
    return GeocodingSuggestion(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? json['address'] as String? ?? '',
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
    );
  }
}

class GeocodingRepository {
  GeocodingRepository(this._dio);

  final Dio _dio;

  Future<List<GeocodingSuggestion>> autocomplete({
    required String query,
    required String citySlug,
    required String language,
    CancelToken? cancelToken,
  }) async {
    final response = await _dio.get(
      '/geocoding/autocomplete',
      queryParameters: {
        'q': query,
        'citySlug': citySlug,
        'language': language,
      },
      cancelToken: cancelToken,
    );
    final data = response.data;
    if (data is! List) return const [];
    return data
        .map((e) => GeocodingSuggestion.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GeocodingSuggestion?> reverse({
    required double latitude,
    required double longitude,
    required String citySlug,
    required String language,
    CancelToken? cancelToken,
  }) async {
    final response = await _dio.get(
      '/geocoding/reverse',
      queryParameters: {
        'lat': latitude,
        'lng': longitude,
        'citySlug': citySlug,
        'language': language,
      },
      cancelToken: cancelToken,
    );
    final data = response.data;
    if (data == null) return null;
    if (data is Map<String, dynamic>) {
      return GeocodingSuggestion.fromJson(data);
    }
    return null;
  }
}

final geocodingRepositoryProvider = Provider(
  (ref) => GeocodingRepository(ref.watch(dioProvider)),
);
