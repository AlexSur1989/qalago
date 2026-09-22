import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_photos_gallery_state.dart';
import 'package:qalago_mobile/features/businesses/providers/business_catalog_provider.dart';

void main() {
  const b = 'cmpn1wnq1000iult8yj6a06q7';
  const l1 = 'bl7085ee9a617ae8b64026db';
  const l2 = 'cmubk34fk0001uls458d1nta9';

  Map<String, dynamic> item(String url, {String? scope}) => {
        'id': url,
        'imageUrl': url,
        if (scope != null) 'scope': scope,
      };

  final l1Response = [
    item('/uploads/qa-a775/qa-l1-a775.png', scope: 'branch'),
    item('/uploads/qa-a775/qa-brand-a775.png', scope: 'brand'),
    item('/legacy-1.jpg', scope: 'brand'),
  ];

  final l2Response = [
    item('/uploads/qa-a775/qa-l2-a775.png', scope: 'branch'),
    item('/uploads/qa-a775/qa-brand-a775.png', scope: 'brand'),
    item('/legacy-1.jpg', scope: 'brand'),
  ];

  test('A — provider/query identity differs L1 vs L2', () {
    const q1 = BusinessPhotosQuery(businessId: b, locationId: l1);
    const q2 = BusinessPhotosQuery(businessId: b, locationId: l2);
    expect(q1, isNot(q2));
    expect(businessPhotosScopeKey(businessId: b, locationId: l1),
        isNot(businessPhotosScopeKey(businessId: b, locationId: l2)));
  });

  test('B — pagination page 2 query retains locationId', () {
    const q = BusinessPhotosQuery(businessId: b, page: 2, locationId: l2);
    expect(q.locationId, l2);
    expect(q.page, 2);
  });

  test('C — no-location legacy query remains compatible', () {
    const q = BusinessPhotosQuery(businessId: b);
    expect(q.locationId, isNull);
    expect(businessPhotosScopeKey(businessId: b, locationId: null), '$b|');
  });

  test('D/E — L1 then L2: page 1 display uses provider, not stale L1 accumulation', () {
    final staleAfterL1 = List<Map<String, dynamic>>.from(l1Response);

    final l2Display = resolveBusinessPhotosDisplayItems(
      page: 1,
      providerPageItems: l2Response,
      accumulatedItems: staleAfterL1,
    );

    expect(l2Display.any((i) => i['imageUrl'].toString().contains('qa-l1')), isFalse);
    expect(l2Display.first['imageUrl'], '/uploads/qa-a775/qa-l2-a775.png');
    expect(l2Display[1]['imageUrl'], '/uploads/qa-a775/qa-brand-a775.png');
  });

  test('L2 → L1 sequence — no QA L2 in L1 provider view', () {
    final staleL2 = List<Map<String, dynamic>>.from(l2Response);
    final l1Display = resolveBusinessPhotosDisplayItems(
      page: 1,
      providerPageItems: l1Response,
      accumulatedItems: staleL2,
    );
    expect(l1Display.any((i) => i['imageUrl'].toString().contains('qa-l2')), isFalse);
    expect(l1Display.first['imageUrl'], '/uploads/qa-a775/qa-l1-a775.png');
  });

  test('page 2 uses accumulated items only', () {
    final acc = [...l2Response, item('/legacy-2.jpg')];
    final display = resolveBusinessPhotosDisplayItems(
      page: 2,
      providerPageItems: [item('/page2-only.jpg')],
      accumulatedItems: acc,
    );
    expect(display, acc);
  });
}
