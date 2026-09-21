import 'package:dio/dio.dart';

enum PushPlatformDto { android, ios }

extension PushPlatformDtoJson on PushPlatformDto {
  String get apiValue => switch (this) {
        PushPlatformDto.android => 'ANDROID',
        PushPlatformDto.ios => 'IOS',
      };
}

class PushDeviceApi {
  PushDeviceApi(this._dio);

  final Dio _dio;

  Future<void> register({
    required String token,
    required PushPlatformDto platform,
    String? locale,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      '/notifications/devices',
      data: {
        'token': token,
        'platform': platform.apiValue,
        if (locale != null) 'locale': locale,
      },
    );
  }

  Future<void> revoke({required String token}) async {
    await _dio.delete<Map<String, dynamic>>(
      '/notifications/devices',
      data: {'token': token},
    );
  }
}
