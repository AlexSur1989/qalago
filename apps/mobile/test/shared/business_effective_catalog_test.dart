import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/businesses/providers/business_catalog_provider.dart';
import 'package:qalago_mobile/shared/utils/business_effective_catalog.dart';

void main() {
  const businessId = 'biz-a';
  const l1 = 'loc-l1';
  const l2 = 'loc-l2';
  Map<String, dynamic> detailWith({
    Map<String, dynamic>? effectiveCatalog,
    Map<String, dynamic>? catalogPreview,
    Map<String, dynamic>? effectivePromotions,
    Map<String, dynamic>? promotionsPreview,
    String? activeLocationId,
    List<dynamic>? legacyPromotions,
  }) {
    return {
      if (activeLocationId != null) 'activeLocationId': activeLocationId,
      if (effectiveCatalog != null) 'effectiveCatalog': effectiveCatalog,
      if (catalogPreview != null) 'catalogPreview': catalogPreview,
      if (effectivePromotions != null) 'effectivePromotions': effectivePromotions,
      if (promotionsPreview != null) 'promotionsPreview': promotionsPreview,
      if (legacyPromotions != null) 'promotions': legacyPromotions,
    };
  }

  group('effective catalog detail preview (6.12A.7.8.5)', () {
    test('A — L1 detail uses effective catalog items', () {
      final data = detailWith(
        activeLocationId: l1,
        effectiveCatalog: {
          'activeLocationId': l1,
          'items': [
            {'id': 'i1', 'title': 'L1 item'},
          ],
          'totalCount': 1,
          'sections': [],
        },
        catalogPreview: {
          'items': [
            {'id': 'legacy', 'title': 'Business-wide leak'},
          ],
          'totalCount': 99,
        },
      );
      final preview = resolveConsumerDetailCatalogPreview(data);
      expect(preview.usedEffectiveSource, isTrue);
      expect(preview.items.single['title'], 'L1 item');
      expect(preview.activeLocationId, l1);
    });

    test('B — L2 detail uses different effective catalog', () {
      final data = detailWith(
        activeLocationId: l2,
        effectiveCatalog: {
          'activeLocationId': l2,
          'items': [
            {'id': 'i2', 'title': 'L2 item'},
          ],
          'totalCount': 1,
          'sections': [],
        },
      );
      final preview = resolveConsumerDetailCatalogPreview(data);
      expect(preview.items.single['title'], 'L2 item');
    });

    test('C — L1 effective promotions', () {
      final data = detailWith(
        effectivePromotions: {
          'activeLocationId': l1,
          'items': [
            {'id': 'p1', 'title': 'Promo L1', 'status': 'ACTIVE'},
          ],
          'totalCount': 1,
        },
        promotionsPreview: {
          'items': [
            {'id': 'p-all', 'title': 'Legacy promo', 'status': 'ACTIVE'},
          ],
          'totalCount': 5,
        },
      );
      final preview = resolveConsumerDetailPromotionsPreview(data);
      expect(preview.usedEffectiveSource, isTrue);
      expect(preview.items.single['title'], 'Promo L1');
    });

    test('D — L2 effective promotions', () {
      final data = detailWith(
        effectivePromotions: {
          'activeLocationId': l2,
          'items': [
            {'id': 'p2', 'title': 'Promo L2', 'status': 'ACTIVE'},
          ],
          'totalCount': 1,
        },
      );
      final preview = resolveConsumerDetailPromotionsPreview(data);
      expect(preview.items.single['title'], 'Promo L2');
    });

    test('E — effective empty catalog does NOT fall back to legacy', () {
      final data = detailWith(
        effectiveCatalog: {
          'activeLocationId': l2,
          'items': <dynamic>[],
          'totalCount': 0,
          'sections': [],
        },
        catalogPreview: {
          'items': [
            {'id': 'x', 'title': 'Should not appear'},
          ],
          'totalCount': 10,
        },
      );
      final preview = resolveConsumerDetailCatalogPreview(data);
      expect(preview.usedEffectiveSource, isTrue);
      expect(preview.items, isEmpty);
      expect(preview.totalCount, 0);
    });

    test('F — effective empty promotions does NOT fall back to legacy', () {
      final data = detailWith(
        effectivePromotions: {
          'activeLocationId': l2,
          'items': <dynamic>[],
          'totalCount': 0,
        },
        promotionsPreview: {
          'items': [
            {'id': 'p', 'title': 'Legacy', 'status': 'ACTIVE'},
          ],
          'totalCount': 3,
        },
        legacyPromotions: [
          {'id': 'p2', 'title': 'Also legacy', 'status': 'ACTIVE'},
        ],
      );
      final preview = resolveConsumerDetailPromotionsPreview(data);
      expect(preview.usedEffectiveSource, isTrue);
      expect(preview.items, isEmpty);
    });

    test('G — missing effective falls back to legacy catalog preview', () {
      final data = detailWith(
        catalogPreview: {
          'items': [
            {'id': '1', 'title': 'Legacy catalog'},
          ],
          'totalCount': 4,
        },
      );
      final preview = resolveConsumerDetailCatalogPreview(data);
      expect(preview.usedEffectiveSource, isFalse);
      expect(preview.items.single['title'], 'Legacy catalog');
    });

    test('G2 — missing effective promotions uses promotionsPreview / promotions', () {
      final data = detailWith(
        promotionsPreview: {
          'items': [
            {'id': 'p', 'title': 'From preview', 'status': 'ACTIVE'},
          ],
          'totalCount': 1,
        },
      );
      final preview = resolveConsumerDetailPromotionsPreview(data);
      expect(preview.usedEffectiveSource, isFalse);
      expect(preview.items.single['title'], 'From preview');
    });

    test('H — full catalog route encodes locationId=L2', () {
      expect(
        businessCatalogRoutePath(businessId: businessId, locationId: l2),
        '/business/$businessId/catalog?locationId=$l2',
      );
    });

    test('I/J/K/L — catalog query key includes locationId for pagination/search/section', () {
      const base = BusinessCatalogQuery(businessId: businessId, locationId: l2);
      expect(
        base,
        equals(const BusinessCatalogQuery(businessId: businessId, locationId: l2)),
      );
      expect(
        base,
        isNot(equals(const BusinessCatalogQuery(businessId: businessId, locationId: l1))),
      );
      expect(
        const BusinessCatalogQuery(businessId: businessId, page: 2, locationId: l2).locationId,
        l2,
      );
      expect(
        const BusinessCatalogQuery(
          businessId: businessId,
          page: 1,
          search: 'tea',
          locationId: l2,
        ).locationId,
        l2,
      );
      expect(
        const BusinessCatalogQuery(
          businessId: businessId,
          sectionId: 'sec-1',
          locationId: l2,
        ).locationId,
        l2,
      );
    });

    test('M — catalog scope keys differ for L1 vs L2', () {
      expect(
        businessCatalogScopeKey(businessId: businessId, locationId: l1),
        isNot(businessCatalogScopeKey(businessId: businessId, locationId: l2)),
      );
    });

    test('O — backend primary wins over mismatched effective activeLocationId', () {
      final catalog = const ConsumerDetailCatalogPreview(
        items: [],
        totalCount: 0,
        activeLocationId: l1,
        usedEffectiveSource: true,
      );
      final data = detailWith(activeLocationId: l2);
      expect(
        resolveCatalogNavigationLocationId(data: data, catalog: catalog),
        l2,
      );
    });

    test('P — business id unchanged in catalog route (reviews/favorites stay business-scoped)', () {
      final path = businessCatalogRoutePath(businessId: businessId, locationId: l2);
      expect(path.contains('/business/$businessId/'), isTrue);
      expect(path.contains(l2), isTrue);
    });

    test('Q — map-style detail route still supports locationId query', () {
      final uri = Uri.parse('/business/$businessId?source=map&locationId=$l2');
      expect(uri.queryParameters['locationId'], l2);
      expect(uri.pathSegments.last, businessId);
    });
  });
}
