import 'dart:convert';

import 'package:dio/dio.dart';

/// Reads stable API error codes from Dio failure responses.
String? extractApiErrorCode(Object error) {
  if (error is! DioException) return null;
  final data = error.response?.data;
  if (data is Map) {
    final top = data['code'];
    if (top is String && top.isNotEmpty) return top;
    final message = data['message'];
    if (message is Map) {
      final nested = message['code'];
      if (nested is String && nested.isNotEmpty) return nested;
    }
  }
  if (data is String && data.isNotEmpty) {
    try {
      final decoded = jsonDecode(data);
      if (decoded is Map && decoded['code'] is String) {
        return decoded['code'] as String;
      }
    } catch (_) {
      return null;
    }
  }
  return null;
}
