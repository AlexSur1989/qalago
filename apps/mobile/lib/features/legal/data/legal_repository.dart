import 'package:dio/dio.dart';

class LegalPendingDocument {
  LegalPendingDocument({
    required this.documentId,
    required this.type,
    required this.version,
    this.publicUrl,
  });

  final String documentId;
  final String type;
  final String version;
  final String? publicUrl;

  factory LegalPendingDocument.fromJson(Map<String, dynamic> json) {
    return LegalPendingDocument(
      documentId: json['documentId'] as String,
      type: json['type'] as String,
      version: json['version'] as String,
      publicUrl: json['publicUrl'] as String?,
    );
  }
}

class LegalCurrentState {
  LegalCurrentState({
    required this.acceptanceRequired,
    required this.pending,
    required this.requiredDocuments,
  });

  final bool acceptanceRequired;
  final List<LegalPendingDocument> pending;
  final List<LegalPendingDocument> requiredDocuments;

  factory LegalCurrentState.fromJson(Map<String, dynamic> json) {
    final pendingRaw = json['pendingAcceptance'] as List<dynamic>? ?? const [];
    final requiredRaw = json['requiredDocuments'] as List<dynamic>? ?? const [];
    return LegalCurrentState(
      acceptanceRequired: json['acceptanceRequired'] as bool? ?? false,
      pending: pendingRaw
          .map((e) => LegalPendingDocument.fromJson(e as Map<String, dynamic>))
          .toList(),
      requiredDocuments: requiredRaw
          .map((e) => LegalPendingDocument.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class LegalRepository {
  LegalRepository(this._dio);

  final Dio _dio;

  Future<LegalCurrentState> fetchCurrent({required String localeCode}) {
    final apiLocale = localeCode.startsWith('kk') ? 'KK' : 'RU';
    return _dio
        .get<Map<String, dynamic>>(
          '/legal/current',
          queryParameters: {'locale': apiLocale},
        )
        .then((r) => LegalCurrentState.fromJson(r.data!));
  }

  Future<void> acceptRequired({
    required String localeCode,
    required List<LegalPendingDocument> pending,
  }) async {
    final apiLocale = localeCode.startsWith('kk') ? 'KK' : 'RU';
    await _dio.post(
      '/legal/me/accept-required',
      data: {
        'acceptanceSource': 'LOGIN',
        'locale': apiLocale,
        'items': pending
            .map(
              (p) => {
                'documentId': p.documentId,
                'documentVersion': p.version,
              },
            )
            .toList(),
      },
    );
  }
}
