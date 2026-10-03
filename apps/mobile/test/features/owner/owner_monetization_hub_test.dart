import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_labels.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_models.dart';
import 'package:qalago_mobile/features/owner/monetization/data/owner_monetization_hub.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';

MonetizationProduct _product(String code) => MonetizationProduct(
      code: code,
      name: code,
      type: 'AD',
      durations: const [],
    );

MonetizationCampaign _campaign(String status) => MonetizationCampaign.fromJson({
      'id': 'c-$status',
      'status': status,
      'businessId': 'b1',
      'product': <String, dynamic>{
        'code': 'BOOST',
        'name': 'Boost',
        'type': 'AD',
      },
      'metrics': <String, dynamic>{},
    });

MonetizationOrder _order(String status) => MonetizationOrder.fromJson({
      'id': 'o-$status',
      'orderNumber': 'ORD-1',
      'status': status,
      'totalAmount': 1000,
      'currency': 'KZT',
      'createdAt': '2026-01-01T00:00:00.000Z',
      'items': [],
      'payments': [],
    });

void main() {
  final ru = lookupAppLocalizations(const Locale('ru'));
  final kk = lookupAppLocalizations(const Locale('kk'));

  test('landing section titles exist in RU and KK', () {
    expect(ru.ownerMyPlanSectionTitle, 'Мой тариф');
    expect(ru.ownerAdvertisingSectionTitle, isNotEmpty);
    expect(kk.ownerMyPlanSectionTitle, 'Менің тарифім');
    expect(kk.ownerAdvertisingSectionTitle, isNotEmpty);
    expect(ru.ownerMonetizationHubIntro.toLowerCase(), contains('тариф'));
    expect(kk.ownerMonetizationHubIntro.toLowerCase(), contains('тариф'));
  });

  test('VIP plan tier does not imply home VIP banner product', () {
    expect(planTierImpliesHomeVipBanner('VIP'), isFalse);
    expect(planTierImpliesHomeVipBanner('PREMIUM'), isFalse);
  });

  test('PlanPayment pending is separate from ad orders awaiting payment', () {
    final planPending = findPlanPendingPayment([
      {'status': 'PENDING', 'tier': 'VIP', 'amountKzt': 5000},
    ]);
    expect(planPending, isNotNull);

    final adPending = countAdOrdersAwaitingPayment([
      _order('AWAITING_PAYMENT'),
      _order('PAID'),
    ]);
    expect(adPending, 1);
    expect(findPlanPendingPayment([{'status': 'AWAITING_PAYMENT'}]), isNull);
  });

  test('human-readable ad labels and no raw codes as primary titles', () {
    for (final code in [
      'HOME_VIP_BANNER',
      'HOME_FEATURED',
      'CATEGORY_TOP',
      'CATEGORY_BOOST',
      'PROMOTED_PROMOTION',
    ]) {
      final title = productTitle(ru, code);
      expect(title, isNot(equals(code)));
      expect(title, isNot(contains('HOME_')));
      expect(title, isNot(contains('CATEGORY_')));
    }
    expect(productTitle(ru, 'VIP_BANNER'), ru.monetizationProductVipBanner);
  });

  test('business vs promotion product filter', () {
    final products = [
      _product('VIP_BANNER'),
      _product('PROMOTED_PROMOTION'),
      _product('TOP_CATEGORY'),
    ];
    final business = filterMonetizationProductsBySubject(
      products,
      MonetizationPromoteSubject.business,
    );
    expect(business.map((p) => p.code), ['VIP_BANNER', 'TOP_CATEGORY']);

    final promo = filterMonetizationProductsBySubject(
      products,
      MonetizationPromoteSubject.promotion,
    );
    expect(promo.map((p) => p.code), ['PROMOTED_PROMOTION']);
  });

  test('advertising package codes are flagged distinct from plan tiers', () {
    expect(isAdvertisingPackageCode('START'), isTrue);
    expect(isAdvertisingPackageCode('BUSINESS'), isTrue);
    expect(isAdvertisingPackageCode('VIP'), isFalse);
    expect(ru.ownerAdPackagesNotPlansSubtitle, contains('подписк'));
    expect(kk.ownerAdPackagesNotPlansSubtitle, isNotEmpty);
  });

  test('campaign statuses grouped for hub KPIs', () {
    final counts = countCampaignStatuses([
      _campaign('ACTIVE'),
      _campaign('SCHEDULED'),
      _campaign('PENDING_MODERATION'),
      _campaign('COMPLETED'),
      _campaign('PAUSED'),
    ]);
    expect(counts.active, 1);
    expect(counts.scheduled, 1);
    expect(counts.moderation, 1);
    expect(counts.completed, 1);
  });

  test('plan ad discount read from limits only', () {
    expect(
      readAdvertisingDiscountPercent({
        'limits': {'advertisingDiscountPercent': 15},
      }),
      15,
    );
    expect(readAdvertisingDiscountPercent({'limits': {}}), isNull);
  });

  test('permission-aware monetization hub gates', () {
    final owner = BusinessAccess(
      role: BusinessAccessRole.owner,
      permissions: const [],
    );
    expect(canViewOwnerPlanOnMonetizationHub(owner), isTrue);
    expect(canManageOwnerAdvertising(owner), isTrue);

    final managerAds = BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: const [BusinessPermission.adsManage],
    );
    expect(canViewOwnerPlanOnMonetizationHub(managerAds), isFalse);
    expect(canManageOwnerAdvertising(managerAds), isTrue);

    final managerPlan = BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: const [BusinessPermission.paymentsView],
    );
    expect(canViewOwnerPlanOnMonetizationHub(managerPlan), isTrue);
    expect(canManageOwnerAdvertising(managerPlan), isFalse);
  });

  test('monthlyAdBonus is not part of owner monetization hub API surface', () {
    expect(
      () => readAdvertisingDiscountPercent({
        'limits': {'monthlyAdBonusKzt': 5000},
      }),
      returnsNormally,
    );
    expect(
      readAdvertisingDiscountPercent({
        'limits': {'monthlyAdBonusKzt': 5000},
      }),
      isNull,
    );
  });
}
