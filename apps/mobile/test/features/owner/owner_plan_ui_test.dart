import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_plan_ui.dart';

void main() {
  group('canOfferPlanPurchase', () {
    test('FREE can buy BASIC PREMIUM VIP', () {
      for (final tier in ['BASIC', 'PREMIUM', 'VIP']) {
        expect(
          canOfferPlanPurchase(
            effectiveTier: 'FREE',
            targetTier: tier,
            hasPendingPayment: false,
          ),
          isTrue,
        );
      }
    });

    test('BASIC renew and upgrades only', () {
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'BASIC',
          targetTier: 'BASIC',
          hasPendingPayment: false,
        ),
        isTrue,
      );
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'BASIC',
          targetTier: 'PREMIUM',
          hasPendingPayment: false,
        ),
        isTrue,
      );
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'BASIC',
          targetTier: 'FREE',
          hasPendingPayment: false,
        ),
        isFalse,
      );
    });

    test('PREMIUM renew and VIP only', () {
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'PREMIUM',
          targetTier: 'BASIC',
          hasPendingPayment: false,
        ),
        isFalse,
      );
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'PREMIUM',
          targetTier: 'VIP',
          hasPendingPayment: false,
        ),
        isTrue,
      );
    });

    test('VIP renew only', () {
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'VIP',
          targetTier: 'VIP',
          hasPendingPayment: false,
        ),
        isTrue,
      );
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'VIP',
          targetTier: 'PREMIUM',
          hasPendingPayment: false,
        ),
        isFalse,
      );
    });

    test('pending blocks all purchases', () {
      expect(
        canOfferPlanPurchase(
          effectiveTier: 'FREE',
          targetTier: 'BASIC',
          hasPendingPayment: true,
        ),
        isFalse,
      );
    });
  });

  group('listOfferedPlanPurchaseTiers', () {
    test('matches web matrix', () {
      expect(listOfferedPlanPurchaseTiers('FREE'), ['BASIC', 'PREMIUM', 'VIP']);
      expect(listOfferedPlanPurchaseTiers('BASIC'), ['BASIC', 'PREMIUM', 'VIP']);
      expect(listOfferedPlanPurchaseTiers('PREMIUM'), ['PREMIUM', 'VIP']);
      expect(listOfferedPlanPurchaseTiers('VIP'), ['VIP']);
    });
  });

  group('planPurchaseActionKind', () {
    test('renew vs upgrade', () {
      expect(
        planPurchaseActionKind('BASIC', 'BASIC'),
        PlanPurchaseActionKind.renew,
      );
      expect(
        planPurchaseActionKind('BASIC', 'VIP'),
        PlanPurchaseActionKind.upgrade,
      );
      expect(
        planPurchaseActionKind('FREE', 'BASIC'),
        PlanPurchaseActionKind.choose,
      );
    });
  });

  group('findPendingPlanPayment', () {
    test('returns first PENDING', () {
      final pending = findPendingPlanPayment([
        {'status': 'COMPLETED', 'id': '1'},
        {'status': 'PENDING', 'id': '2', 'tier': 'BASIC'},
      ]);
      expect(pending?['id'], '2');
    });
  });

  group('planCheckoutMode', () {
    test('production when mock flag off', () {
      expect(
        planCheckoutMode(mockPlanCheckoutEnabled: false),
        PlanCheckoutMode.production,
      );
    });
  });

  group('PlanPurchaseAttemptTracker', () {
    test('reuses key for same business and tier', () {
      final tracker = PlanPurchaseAttemptTracker();
      final a = tracker.begin('b1', 'BASIC');
      final b = tracker.begin('b1', 'BASIC');
      expect(a, b);
    });

    test('new key when tier changes', () {
      final tracker = PlanPurchaseAttemptTracker();
      final a = tracker.begin('b1', 'BASIC');
      final b = tracker.begin('b1', 'VIP');
      expect(a, isNot(b));
    });
  });

  group('buildCreatePlanPurchaseBody', () {
    test('sends tier only without idempotency', () {
      expect(buildCreatePlanPurchaseBody(tier: 'BASIC'), {'tier': 'BASIC'});
    });

    test('includes idempotency key when provided', () {
      final body = buildCreatePlanPurchaseBody(
        tier: 'VIP',
        idempotencyKey: 'key-1',
      );
      expect(body['tier'], 'VIP');
      expect(body['idempotencyKey'], 'key-1');
      expect(body.containsKey('amountKzt'), isFalse);
      expect(body.containsKey('expiresAt'), isFalse);
    });
  });
}
