import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/legal/data/legal_repository.dart';

void main() {
  group('LegalCurrentState', () {
    test('parses pending acceptance from API payload', () {
      final state = LegalCurrentState.fromJson({
        'acceptanceRequired': true,
        'pendingAcceptance': [
          {
            'documentId': 'd1',
            'type': 'TERMS_OF_SERVICE',
            'version': '2026-09-10',
            'publicUrl': 'http://localhost:3005/terms',
          },
        ],
        'requiredDocuments': [],
      });
      expect(state.acceptanceRequired, isTrue);
      expect(state.pending.single.documentId, 'd1');
      expect(state.pending.single.version, '2026-09-10');
    });
  });

  group('LegalRequiredState', () {
    test('parses contextual required payload', () {
      final state = LegalRequiredState.fromJson({
        'context': 'PLAN_PURCHASE',
        'acceptanceRequired': true,
        'pendingAcceptance': [
          {
            'documentId': 'offer-1',
            'type': 'PUBLIC_OFFER',
            'version': '2026-10-03-v1',
          },
        ],
      });
      expect(state.context, 'PLAN_PURCHASE');
      expect(state.pending.single.type, 'PUBLIC_OFFER');
    });
  });
}
