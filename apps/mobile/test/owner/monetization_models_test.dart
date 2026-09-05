import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_formatters.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_labels.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_models.dart';

void main() {
  group('MonetizationProduct', () {
    test('1. products parse', () {
      final product = MonetizationProduct.fromJson({
        'code': 'TOP_CATEGORY',
        'name': 'TOP',
        'description': 'desc',
        'type': 'TOP_CATEGORY',
        'durations': [
          {
            'durationDays': 7,
            'basePrice': 4900,
            'finalPrice': 4410,
            'discountPercent': 10,
            'currency': 'KZT',
          },
        ],
      });
      expect(product.code, 'TOP_CATEGORY');
      expect(product.durations.first.finalPrice, 4410);
    });
  });

  group('MonetizationPackage', () {
    test('2. packages parse', () {
      final pkg = MonetizationPackage.fromJson({
        'code': 'START',
        'name': 'START',
        'price': 6900,
        'currency': 'KZT',
        'durationDays': 7,
        'items': [],
      });
      expect(pkg.code, 'START');
      expect(pkg.price, 6900);
    });
  });

  group('MonetizationQuote', () {
    test('3. quote parse', () {
      final quote = MonetizationQuote.fromJson({
        'product': {'code': 'TOP_CATEGORY', 'name': 'TOP', 'type': 'TOP_CATEGORY'},
        'duration': {'durationDays': 7},
        'basePrice': 4900,
        'discountPercent': 10,
        'discountAmount': 490,
        'finalPrice': 4410,
        'currency': 'KZT',
        'availability': {'available': true},
      });
      expect(quote.finalPrice, 4410);
      expect(quote.discountAmount, 490);
    });

    test('4. discount parse', () {
      final quote = MonetizationQuote.fromJson({
        'product': {'code': 'BOOST', 'name': 'Boost', 'type': 'BOOST'},
        'duration': {'durationDays': 3},
        'basePrice': 700,
        'discountPercent': 0,
        'discountAmount': 0,
        'finalPrice': 700,
        'currency': 'KZT',
        'availability': {'available': true},
      });
      expect(quote.discountPercent, 0);
    });

    test('5. unavailable quote parse', () {
      final quote = MonetizationQuote.fromJson({
        'product': {'code': 'TOP_CATEGORY', 'name': 'TOP', 'type': 'TOP_CATEGORY'},
        'duration': {'durationDays': 7},
        'basePrice': 4900,
        'discountPercent': 0,
        'discountAmount': 0,
        'finalPrice': 4900,
        'currency': 'KZT',
        'availability': {
          'available': false,
          'nextAvailableAt': '2026-09-10T00:00:00.000Z',
        },
      });
      expect(quote.availability.available, isFalse);
      expect(quote.availability.nextAvailableAt, isNotNull);
    });
  });

  group('MonetizationOrder', () {
    test('7. order response parse', () {
      final order = MonetizationOrder.fromJson({
        'id': 'ord-1',
        'orderNumber': 'QLG-001',
        'status': 'AWAITING_PAYMENT',
        'subtotal': 4900,
        'discountAmount': 490,
        'totalAmount': 4410,
        'currency': 'KZT',
        'createdAt': '2026-09-05T10:00:00.000Z',
        'items': [
          {
            'id': 'item-1',
            'productCode': 'TOP_CATEGORY',
            'productName': 'TOP',
            'productType': 'TOP_CATEGORY',
            'quantity': 1,
            'basePrice': 4900,
            'discountPercent': 10,
            'discountAmount': 490,
            'finalPrice': 4410,
            'durationDays': 7,
          },
        ],
        'payments': [],
      });
      expect(order.orderNumber, 'QLG-001');
      expect(order.status, 'AWAITING_PAYMENT');
    });
  });

  group('MonetizationCampaign', () {
    test('8. campaign response parse', () {
      final campaign = MonetizationCampaign.fromJson({
        'id': 'camp-1',
        'businessId': 'biz-1',
        'status': 'ACTIVE',
        'effectiveStatus': 'ACTIVE',
        'startAt': '2026-09-05T00:00:00.000Z',
        'endAt': '2026-09-12T00:00:00.000Z',
        'product': {'code': 'TOP_CATEGORY', 'name': 'TOP', 'type': 'TOP_CATEGORY'},
        'placements': [{'code': 'CATEGORY_TOP', 'name': 'Top'}],
        'metrics': {
          'servedCount': 100,
          'qualifiedImpressions': 50,
          'clickCount': 5,
        },
      });
      expect(campaign.displayStatus, 'ACTIVE');
      expect(campaign.metrics.clickCount, 5);
    });
  });

  group('MonetizationCampaignAnalytics', () {
    test('9. analytics parse', () {
      final analytics = MonetizationCampaignAnalytics.fromJson({
        'campaignId': 'camp-1',
        'served': 100,
        'qualifiedImpressions': 50,
        'clicks': 5,
        'ctr': 10,
        'actions': {'AD_CARD_OPEN': 3},
        'period': {'from': '2026-09-01', 'to': '2026-09-05'},
      });
      expect(analytics.qualifiedImpressions, 50);
      expect(analytics.actions['AD_CARD_OPEN'], 3);
    });
  });

  group('formatters and labels', () {
    test('10. price formatting', () {
      expect(formatKztPrice(4900), '4 900 ₸');
      expect(formatKztPrice(12900), '12 900 ₸');
    });

    test('11. status mapping', () {
      expect(orderStatusLabel('AWAITING_PAYMENT'), 'Ожидает оплаты');
      expect(campaignStatusLabel('ACTIVE'), 'Активно');
      expect(campaignStatusLabel('PENDING_MODERATION'), 'На модерации');
    });

    test('12. product title mapping', () {
      expect(productTitle('VIP_BANNER'), 'VIP-баннер');
      expect(productTitle('TOP_CATEGORY'), 'TOP категории');
    });
  });
}
