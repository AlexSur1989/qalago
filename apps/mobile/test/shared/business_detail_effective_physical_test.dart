import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';

void main() {
  const businessId = 'b1';

  final legacyTopLevel = {
    'id': businessId,
    'address': 'Legacy street',
    'latitude': 51.0,
    'longitude': 51.1,
    'phone': '+7000',
    'whatsapp': '+7111',
    'instagram': '@legacy',
    'website': 'legacy.kz',
    'workHours': {'mon': '09:00-18:00'},
  };

  test('parses effectivePhysical for L2 address and coordinates', () {
    final data = {
      ...legacyTopLevel,
      'activeLocationId': 'loc-l2',
      'effectivePhysical': {
        'locationId': 'loc-l2',
        'isPrimary': false,
        'cityId': 'city-1',
        'address': 'Branch street',
        'latitude': 51.245,
        'longitude': 51.405,
        'phone': '+7999',
        'whatsapp': '+7888',
        'instagram': '@branch',
        'website': 'branch.kz',
        'workHours': {'mon': '10:00-22:00'},
      },
    };

    final ctx = activePhysicalContextFromDetail(
      businessData: data,
      businessId: businessId,
    );

    expect(ctx.address, 'Branch street');
    expect(ctx.latitude, 51.245);
    expect(ctx.longitude, 51.405);
    expect(ctx.phone, '+7999');
    expect(ctx.whatsapp, '+7888');
    expect(ctx.instagram, '@branch');
    expect(ctx.website, 'branch.kz');
    expect(ctx.workHours, {'mon': '10:00-22:00'});
    expect(ctx.isPrimary, isFalse);
  });

  test('L2 route coordinates from effectivePhysical', () {
    final ctx = activePhysicalContextFromDetail(
      businessData: {
        ...legacyTopLevel,
        'effectivePhysical': {
          'locationId': 'loc-l2',
          'isPrimary': false,
          'cityId': 'c1',
          'address': 'Branch',
          'latitude': 51.245,
          'longitude': 51.405,
          'phone': null,
          'whatsapp': null,
          'instagram': null,
          'website': null,
          'workHours': null,
        },
      },
      businessId: businessId,
    );
    final url = buildRouteUrl(
      latitude: ctx.latitude,
      longitude: ctx.longitude,
      address: ctx.address,
    );
    expect(url, contains('51.245'));
    expect(url, isNot(contains('51.0,51.1')));
  });

  test('open status uses effectivePhysical workHours', () {
    final ctx = activePhysicalContextFromDetail(
      businessData: {
        ...legacyTopLevel,
        'effectivePhysical': {
          'locationId': 'loc-l2',
          'isPrimary': false,
          'cityId': 'c1',
          'address': 'Branch',
          'latitude': 1,
          'longitude': 2,
          'phone': null,
          'whatsapp': null,
          'instagram': null,
          'website': null,
          'workHours': {'mon': '00:00-23:59'},
        },
      },
      businessId: businessId,
    );
    expect(hasWorkHours(ctx.workHours), isTrue);
    expect(
      computeOpenStatus(
        ctx.workHours,
        timezone: kDefaultBusinessTimezone,
      ),
      isA<BusinessOpenStatus>(),
    );
  });

  test('primary badge flag does not replace active L2 locationId', () {
    final ctx = activePhysicalContextFromDetail(
      businessData: {
        ...legacyTopLevel,
        'activeLocationId': 'loc-l2',
        'effectivePhysical': {
          'locationId': 'loc-l2',
          'isPrimary': false,
          'cityId': 'c1',
          'address': 'L2',
          'latitude': 1,
          'longitude': 2,
          'phone': null,
          'whatsapp': null,
          'instagram': null,
          'website': null,
          'workHours': null,
        },
      },
      businessId: businessId,
    );
    expect(ctx.locationId, 'loc-l2');
    expect(ctx.isPrimary, isFalse);
  });

  test('falls back to legacy merge when effectivePhysical absent', () {
    final ctx = activePhysicalContextFromDetail(
      businessData: legacyTopLevel,
      businessId: businessId,
    );
    expect(ctx.address, 'Legacy street');
    expect(ctx.phone, '+7000');
  });
}
