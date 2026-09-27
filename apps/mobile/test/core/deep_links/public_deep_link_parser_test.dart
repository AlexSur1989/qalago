import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_locale.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_parse_result.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_parser.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_target.dart';

void main() {
  Uri u(String url) => Uri.parse(url);

  group('valid canonical URLs', () {
    test('city home RU', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/ru/uralsk'));
      expect(r, isA<PublicDeepLinkParsed>());
      final t = (r as PublicDeepLinkParsed).target;
      expect(t, isA<PublicDeepLinkCityHomeTarget>());
      expect(t.locale, PublicDeepLinkLocale.ru);
      expect(t.citySlug, 'uralsk');
    });

    test('city home KK multi-city', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/kk/aktobe'));
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkCityHomeTarget;
      expect(t.locale, PublicDeepLinkLocale.kk);
      expect(t.citySlug, 'aktobe');
    });

    test('categories', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/ru/uralsk/categories'));
      final t = (r as PublicDeepLinkParsed).target;
      expect(t, isA<PublicDeepLinkCategoriesTarget>());
      expect(t.citySlug, 'uralsk');
    });

    test('category slug', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/ru/uralsk/bars'));
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkCategoryTarget;
      expect(t.categorySlug, 'bars');
      expect(t.locale, PublicDeepLinkLocale.ru);
    });

    test('subcategory', () {
      final r = parsePublicDeepLink(
        u('https://qalago.kz/kk/aktobe/food/cafes'),
      );
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkSubcategoryTarget;
      expect(t.categorySlug, 'food');
      expect(t.subcategorySlug, 'cafes');
      expect(t.citySlug, 'aktobe');
    });

    test('business without locationId', () {
      final r = parsePublicDeepLink(
        u('https://qalago.kz/ru/uralsk/business/example-business'),
      );
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkBusinessTarget;
      expect(t.businessSlug, 'example-business');
      expect(t.citySlug, 'uralsk');
      expect(t.locationId, isNull);
    });

    test('business with valid locationId for Phase 2 by-slug API', () {
      const loc = 'clxyz1234567890123456789012';
      final r = parsePublicDeepLink(
        u('https://qalago.kz/ru/uralsk/business/example-business?locationId=$loc'),
      );
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkBusinessTarget;
      expect(t.businessSlug, 'example-business');
      expect(t.citySlug, 'uralsk');
      expect(t.locationId, loc);
    });

    test('search with q', () {
      final r = parsePublicDeepLink(
        u('https://qalago.kz/ru/uralsk/search?q=coffee'),
      );
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkSearchTarget;
      expect(t.query, 'coffee');
    });

    test('search without q', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/kk/aktobe/search'));
      final t = (r as PublicDeepLinkParsed).target as PublicDeepLinkSearchTarget;
      expect(t.query, isNull);
    });

    test('parsePublicDeepLinkString', () {
      final r = parsePublicDeepLinkString('https://qalago.kz/kk/aktobe');
      expect(r, isA<PublicDeepLinkParsed>());
    });
  });

  group('route precedence / reserved segments', () {
    test('/business/foo is Business not Category', () {
      final r = parsePublicDeepLink(
        u('https://qalago.kz/ru/uralsk/business/foo'),
      );
      expect((r as PublicDeepLinkParsed).target, isA<PublicDeepLinkBusinessTarget>());
    });

    test('/search is Search', () {
      final r = parsePublicDeepLink(
        u('https://qalago.kz/ru/uralsk/search?q=x'),
      );
      expect((r as PublicDeepLinkParsed).target, isA<PublicDeepLinkSearchTarget>());
    });

    test('/categories is Categories not category slug', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/ru/uralsk/categories'));
      expect((r as PublicDeepLinkParsed).target, isA<PublicDeepLinkCategoriesTarget>());
    });

    test('reserved promotions segment is invalid as category', () {
      final r = parsePublicDeepLink(u('https://qalago.kz/ru/uralsk/promotions'));
      expect(r, isA<PublicDeepLinkInvalid>());
    });
  });

  group('host / scheme security', () {
    test('rejects http', () {
      expect(
        parsePublicDeepLink(u('http://qalago.kz/ru/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects evil host', () {
      expect(
        parsePublicDeepLink(u('https://evil.example/ru/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects suffix host trick', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz.evil.example/ru/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects subdomain', () {
      expect(
        parsePublicDeepLink(u('https://subdomain.qalago.kz/ru/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects javascript scheme', () {
      expect(
        parsePublicDeepLinkString('javascript:alert(1)'),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects data scheme', () {
      expect(
        parsePublicDeepLinkString('data:text/html,hello'),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects custom scheme', () {
      expect(
        parsePublicDeepLinkString('customscheme://qalago.kz/ru/uralsk'),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects non-default port', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz:8443/ru/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });
  });

  group('locale / legacy paths', () {
    test('rejects en locale', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/en/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('rejects uppercase locale', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/RU/uralsk')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('neutral legacy without locale is unsupported', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/uralsk/business/foo')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });

    test('legacy businesses path unsupported', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/businesses/clxyz123')),
        isA<PublicDeepLinkUnsupported>(),
      );
    });
  });

  group('validation failures', () {
    test('missing city segment', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/ru')),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('empty business slug', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/ru/uralsk/business/')),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('extra business path segment', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/business/foo/extra'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('malformed locationId', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/business/foo?locationId=bad/id'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('forbidden query route=', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/business/foo?route=/evil'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('forbidden query deeplink=', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/search?q=a&deeplink=x'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('unsupported query on city home', () {
      expect(
        parsePublicDeepLink(u('https://qalago.kz/ru/uralsk?utm_source=x')),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('unsupported query on business besides locationId', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/business/foo?q=1'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('encoded slash in segment is invalid', () {
      expect(
        parsePublicDeepLink(
          u('https://qalago.kz/ru/uralsk/business/foo%2Fbar'),
        ),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('malformed percent encoding', () {
      expect(
        parsePublicDeepLinkString('https://qalago.kz/ru/uralsk/business/%'),
        isA<PublicDeepLinkInvalid>(),
      );
    });

    test('empty string input', () {
      expect(parsePublicDeepLinkString(''), isA<PublicDeepLinkUnsupported>());
    });
  });
}
