/// Owner plan purchase UI rules — mirrors `apps/business-web/lib/plan-owner-ui.ts`.

const planTierRankMap = <String, int>{
  'FREE': 0,
  'BASIC': 1,
  'PREMIUM': 2,
  'VIP': 3,
};

int planTierRank(String tier) => planTierRankMap[tier] ?? 0;

Map<String, dynamic>? findPendingPlanPayment(List<Map<String, dynamic>> payments) {
  for (final p in payments) {
    if (p['status'] == 'PENDING') return p;
  }
  return null;
}

bool isLowerPaidPlanTier(String targetTier, String effectiveTier) {
  if (targetTier == 'FREE') return false;
  return planTierRank(targetTier) < planTierRank(effectiveTier);
}

bool isSameTierRenewal(String targetTier, String effectiveTier) {
  return targetTier == effectiveTier && effectiveTier != 'FREE';
}

bool canOfferPlanPurchase({
  required String effectiveTier,
  required String targetTier,
  required bool hasPendingPayment,
}) {
  if (targetTier == 'FREE') return false;
  if (hasPendingPayment) return false;
  if (isLowerPaidPlanTier(targetTier, effectiveTier)) return false;
  if (effectiveTier == 'FREE') return true;
  if (isSameTierRenewal(targetTier, effectiveTier)) return true;
  return planTierRank(targetTier) > planTierRank(effectiveTier);
}

List<String> listOfferedPlanPurchaseTiers(String effectiveTier) {
  switch (effectiveTier) {
    case 'FREE':
      return const ['BASIC', 'PREMIUM', 'VIP'];
    case 'BASIC':
      return const ['BASIC', 'PREMIUM', 'VIP'];
    case 'PREMIUM':
      return const ['PREMIUM', 'VIP'];
    case 'VIP':
      return const ['VIP'];
    default:
      return const ['BASIC', 'PREMIUM', 'VIP'];
  }
}

enum PlanPurchaseActionKind { choose, renew, upgrade }

PlanPurchaseActionKind planPurchaseActionKind(String effectiveTier, String targetTier) {
  if (effectiveTier == 'FREE') return PlanPurchaseActionKind.choose;
  if (isSameTierRenewal(targetTier, effectiveTier)) {
    return PlanPurchaseActionKind.renew;
  }
  return PlanPurchaseActionKind.upgrade;
}

enum PlanCheckoutMode { mock, production }

PlanCheckoutMode planCheckoutMode({required bool mockPlanCheckoutEnabled}) {
  return mockPlanCheckoutEnabled ? PlanCheckoutMode.mock : PlanCheckoutMode.production;
}

/// Stable idempotency key per user purchase intent (tier + business); reused on retry.
class PlanPurchaseAttemptTracker {
  String? _businessId;
  String? _tier;
  String? _idempotencyKey;

  String begin(String businessId, String tier) {
    if (_businessId != businessId || _tier != tier || _idempotencyKey == null) {
      _businessId = businessId;
      _tier = tier;
      _idempotencyKey =
          'mobile-plan-$businessId-$tier-${DateTime.now().microsecondsSinceEpoch}';
    }
    return _idempotencyKey!;
  }

  void clear() {
    _businessId = null;
    _tier = null;
    _idempotencyKey = null;
  }
}

Map<String, dynamic> buildCreatePlanPurchaseBody({
  required String tier,
  String? idempotencyKey,
}) {
  final body = <String, dynamic>{'tier': tier};
  if (idempotencyKey != null && idempotencyKey.isNotEmpty) {
    body['idempotencyKey'] = idempotencyKey;
  }
  return body;
}
