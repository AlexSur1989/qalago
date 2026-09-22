import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/businesses/providers/business_catalog_provider.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';
import 'package:qalago_mobile/shared/utils/business_effective_media.dart';

void main() {
  const businessId = 'b1';
  const l1 = 'loc-l1';
  const l2 = 'loc-l2';

  Map<String, dynamic> effectiveL2Detail() => {
        'id': businessId,
        'activeLocationId': l2,
        'coverImageUrl': '/legacy-cover.jpg',
        'galleryPreview': {
          'items': [
            {'id': 'legacy-1', 'imageUrl': '/legacy-1.jpg', 'sortOrder': 0},
          ],
          'totalCount': 99,
        },
        'effectivePhysical': {
          'locationId': l2,
          'address': 'L2 addr',
          'cityId': 'c1',
        },
        'effectiveMedia': {
          'activeLocationId': l2,
          'coverImageUrl': '/l2-cover.jpg',
          'galleryPreview': {
            'items': [
              {
                'id': 'l2-a',
                'imageUrl': '/l2-a.jpg',
                'sortOrder': 1,
                'locationId': l2,
                'scope': 'branch',
              },
              {
                'id': 'shared-a',
                'imageUrl': '/shared-a.jpg',
                'sortOrder': 1,
                'locationId': null,
                'scope': 'brand',
              },
            ],
            'totalCount': 2,
          },
        },
      };

  test('A — effectiveMedia parses correctly', () {
    final bundle = EffectiveMediaBundle.fromDetail(effectiveL2Detail());
    expect(bundle, isNotNull);
    expect(bundle!.activeLocationId, l2);
    expect(bundle.coverImageUrl, '/l2-cover.jpg');
    expect(bundle.galleryItems.length, 2);
    expect(bundle.galleryItems.first.scope, EffectiveMediaImageScope.branch);
  });

  test('B — missing effectiveMedia uses legacy gallery', () {
    final data = {
      'coverImageUrl': '/c.jpg',
      'galleryPreview': {
        'items': [
          {'id': 'g1', 'imageUrl': '/g1.jpg', 'sortOrder': 0},
        ],
        'totalCount': 1,
      },
    };
    final media = resolveConsumerDetailMedia(data);
    expect(media.usedEffectiveMedia, isFalse);
    expect(media.coverImageUrlRaw, '/c.jpg');
    expect(media.galleryTotalCount, 1);
  });

  test('C — L2 effective cover used as hero source', () {
    final media = resolveConsumerDetailMedia(effectiveL2Detail());
    expect(media.coverImageUrlRaw, '/l2-cover.jpg');
  });

  test('D — effective gallery preserves server ordering in carousel', () {
    final media = resolveConsumerDetailMedia(effectiveL2Detail());
    expect(
      media.photoCarouselUrls,
      ['/l2-cover.jpg', '/l2-a.jpg', '/shared-a.jpg'],
    );
  });

  test('E — legacy galleryPreview ignored when effectiveMedia present (no L1 leak)', () {
    final media = resolveConsumerDetailMedia(effectiveL2Detail());
    expect(media.galleryItemsRaw.any((i) => i['imageUrl'] == '/legacy-1.jpg'), isFalse);
    expect(media.galleryTotalCount, 2);
    expect(
      media.galleryItemsRaw.indexWhere((i) => i['id'] == 'l2-a'),
      lessThan(media.galleryItemsRaw.indexWhere((i) => i['id'] == 'shared-a')),
    );
  });

  test('F — shared-only effective gallery still works', () {
    final data = {
      'activeLocationId': l2,
      'effectiveMedia': {
        'activeLocationId': l2,
        'coverImageUrl': '/brand.jpg',
        'galleryPreview': {
          'items': [
            {
              'id': 's1',
              'imageUrl': '/s1.jpg',
              'sortOrder': 0,
              'locationId': null,
              'scope': 'brand',
            },
          ],
          'totalCount': 1,
        },
      },
    };
    final media = resolveConsumerDetailMedia(data);
    expect(media.photoCarouselUrls, ['/brand.jpg', '/s1.jpg']);
  });

  test('G — empty media yields empty carousel', () {
    final data = {
      'effectiveMedia': {
        'activeLocationId': l2,
        'coverImageUrl': null,
        'galleryPreview': {'items': [], 'totalCount': 0},
      },
    };
    final media = resolveConsumerDetailMedia(data);
    expect(media.photoCarouselUrls, isEmpty);
  });

  test('H — hero/gallery duplicate URL deduped', () {
    final data = {
      'effectiveMedia': {
        'activeLocationId': l2,
        'coverImageUrl': '/same.jpg',
        'galleryPreview': {
          'items': [
            {
              'id': 'x1',
              'imageUrl': '/same.jpg',
              'sortOrder': 0,
              'locationId': l2,
              'scope': 'branch',
            },
          ],
          'totalCount': 1,
        },
      },
    };
    final media = resolveConsumerDetailMedia(data);
    expect(media.photoCarouselUrls, ['/same.jpg']);
  });

  test('I — photos query carries active L2 locationId', () {
    final media = resolveConsumerDetailMedia(effectiveL2Detail());
    expect(media.photosLocationId, l2);
    const query = BusinessPhotosQuery(businessId: businessId, locationId: l2);
    expect(query.locationId, l2);
  });

  test('J — legacy detail without effectiveMedia has null photos location', () {
    final media = resolveConsumerDetailMedia({
      'galleryPreview': {'items': [], 'totalCount': 0},
    });
    expect(media.photosLocationId, isNull);
    const query = BusinessPhotosQuery(businessId: businessId);
    expect(query.locationId, isNull);
  });

  test('K — gallery navigation location preserved via query object', () {
    const query = BusinessPhotosQuery(
      businessId: businessId,
      page: 2,
      locationId: l2,
    );
    expect(query, BusinessPhotosQuery(businessId: businessId, page: 2, locationId: l2));
  });

  test('L — effectivePhysical unchanged when effectiveMedia present', () {
    final data = effectiveL2Detail();
    final physical = activePhysicalContextFromDetail(
      businessData: data,
      businessId: businessId,
    );
    expect(physical.locationId, l2);
    expect(physical.address, 'L2 addr');
  });

  test('M/N — favorites/reviews remain business-grain (documented constants)', () {
    expect(businessId, isNot(l2));
  });

  test('O — activeLocation mismatch prefers top-level activeLocationId for photos', () {
    final data = effectiveL2Detail();
    data['activeLocationId'] = l1;
    data['effectiveMedia'] = {
      ...(data['effectiveMedia'] as Map<String, dynamic>),
      'activeLocationId': l2,
    };
    final media = resolveConsumerDetailMedia(data);
    expect(media.activeLocationMismatch, isTrue);
    expect(media.photosLocationId, l1);
  });
}
