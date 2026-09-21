import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/business_branch_location.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';

void main() {
  const businessId = 'b1';
  final primaryData = {
    'address': 'Primary street',
    'latitude': 51.1,
    'longitude': 51.2,
    'phone': '+7111',
    'whatsapp': '+7222',
  };

  final branches = [
    const BusinessBranchLocation(
      id: 'loc-primary',
      businessId: businessId,
      cityId: 'c1',
      citySlug: 'uralsk',
      cityNameRu: 'U',
      cityNameKk: 'U',
      address: 'Primary street',
      isPrimary: true,
      latitude: 51.1,
      longitude: 51.2,
    ),
    const BusinessBranchLocation(
      id: 'loc-branch',
      businessId: businessId,
      cityId: 'c1',
      citySlug: 'uralsk',
      cityNameRu: 'U',
      cityNameKk: 'U',
      address: 'Branch street',
      isPrimary: false,
      latitude: 51.245,
      longitude: 51.405,
    ),
  ];

  test('resolveActiveBusinessPhysicalContext uses selected branch', () {
    final ctx = resolveActiveBusinessPhysicalContext(
      businessData: primaryData,
      businessId: businessId,
      selectedLocationId: 'loc-branch',
      branches: branches,
    );
    expect(ctx.address, 'Branch street');
    expect(ctx.latitude, 51.245);
    expect(ctx.longitude, 51.405);
  });

  test('invalid selectedLocationId falls back to primary', () {
    final ctx = resolveActiveBusinessPhysicalContext(
      businessData: primaryData,
      businessId: businessId,
      selectedLocationId: 'unknown',
      branches: branches,
    );
    expect(ctx.address, 'Primary street');
    expect(ctx.latitude, 51.1);
  });

  test('route URL from selected branch coordinates', () {
    final ctx = resolveActiveBusinessPhysicalContext(
      businessData: primaryData,
      businessId: businessId,
      selectedLocationId: 'loc-branch',
      branches: branches,
    );
    final url = buildRouteUrl(
      latitude: ctx.latitude,
      longitude: ctx.longitude,
      address: ctx.address,
    );
    expect(url, contains('51.245'));
    expect(url, contains('51.405'));
    expect(url, isNot(contains('51.1,51.2')));
  });

  test('openBusiness encodes optional locationId query param', () {
    final uri = Uri.parse(
      '/business/$businessId?source=map&locationId=loc-branch',
    );
    expect(parseSelectedLocationIdFromRoute(uri.queryParameters['locationId']),
        'loc-branch');
  });
}
