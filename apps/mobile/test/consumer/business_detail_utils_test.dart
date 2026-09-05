import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/utils/ad_url_utils.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';

void main() {
  group('phone normalization', () {
    test('normalizeTelUri handles +7 format', () {
      expect(normalizeTelUri('+7 707 123 45 67'), '+77071234567');
    });

    test('normalizeTelUri converts leading 8 to 7 for KZ', () {
      expect(normalizeTelUri('8 707 123 45 67'), '+77071234567');
    });

    test('normalizeTelUri rejects too short numbers', () {
      expect(normalizeTelUri('123'), isNull);
    });
  });

  group('WhatsApp normalization', () {
    test('normalizeWhatsAppUrl builds wa.me link', () {
      expect(
        normalizeWhatsAppUrl('+77071234567'),
        'https://wa.me/77071234567',
      );
    });

    test('normalizeWhatsAppUrl converts 8 prefix', () {
      expect(
        normalizeWhatsAppUrl('87071234567'),
        'https://wa.me/77071234567',
      );
    });
  });

  group('website URL safety', () {
    test('normalizeWebsiteUrl adds https scheme', () {
      expect(normalizeWebsiteUrl('example.com'), 'https://example.com');
    });

    test('normalizeWebsiteUrl rejects javascript scheme', () {
      expect(normalizeWebsiteUrl('javascript:alert(1)'), isNull);
    });

    test('isSafeHttpUrl rejects file scheme', () {
      expect(isSafeHttpUrl('file:///etc/passwd'), isFalse);
    });
  });

  group('Instagram URL safety', () {
    test('normalizeInstagramUrl from handle', () {
      expect(
        normalizeInstagramUrl('@coffee_uralsk'),
        'https://www.instagram.com/coffee_uralsk/',
      );
    });

    test('normalizeInstagramUrl keeps https URL', () {
      expect(
        normalizeInstagramUrl('https://instagram.com/cafe'),
        'https://instagram.com/cafe',
      );
    });
  });

  group('route URL', () {
    test('buildRouteUrl prefers coordinates', () {
      expect(
        buildRouteUrl(latitude: 51.2, longitude: 51.3, address: 'Street'),
        contains('destination=51.2,51.3'),
      );
    });

    test('buildRouteUrl falls back to address', () {
      expect(
        buildRouteUrl(address: 'Уральск, ул. Тест'),
        contains('query='),
      );
    });

    test('buildRouteUrl returns null without data', () {
      expect(buildRouteUrl(), isNull);
    });
  });

  group('open status', () {
    test('computeOpenStatus returns unknown without hours', () {
      expect(computeOpenStatus(null), BusinessOpenStatus.unknown);
    });

    test('computeOpenStatus detects closed day object', () {
      final status = computeOpenStatus({
        'mon': {'closed': true},
        'tue': '09:00-18:00',
        'wed': '09:00-18:00',
        'thu': '09:00-18:00',
        'fri': '09:00-18:00',
        'sat': '09:00-18:00',
        'sun': '09:00-18:00',
      });
      expect(status, isNot(BusinessOpenStatus.unknown));
    });
  });

  group('promotions filter', () {
    test('filterActivePromotions removes expired', () {
      final past = DateTime.now().toUtc().subtract(const Duration(days: 2));
      final result = filterActivePromotions([
        {
          'title': 'Old',
          'endDate': past.toIso8601String(),
        },
        {
          'title': 'Live',
          'endDate': DateTime.now()
              .toUtc()
              .add(const Duration(days: 2))
              .toIso8601String(),
        },
      ]);
      expect(result, hasLength(1));
      expect(result.first['title'], 'Live');
    });
  });

  group('description', () {
    test('sanitizeDescription strips HTML tags', () {
      expect(
        sanitizeDescription('<p>Hello <b>world</b></p>'),
        'Hello world',
      );
    });

    test('sanitizeDescription returns empty for blank', () {
      expect(sanitizeDescription('   '), '');
    });
  });

  group('reviews', () {
    test('reviewStatsFromList returns null average for zero reviews', () {
      final stats = reviewStatsFromList([]);
      expect(stats.$1, isNull);
      expect(stats.$2, 0);
    });
  });
}
