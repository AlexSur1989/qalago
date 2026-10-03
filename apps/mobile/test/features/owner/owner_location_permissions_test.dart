import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';

void main() {
  test('manager with profile edit sees locations nav item', () {
    const access = BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: [BusinessPermission.businessProfileEdit],
    );
    expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.locations));
  });

  test('manager without profile edit cannot see locations nav item', () {
    const access = BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: [BusinessPermission.catalogEdit],
    );
    expect(filterOwnerNavByPermission(access), isNot(contains(OwnerNavItem.locations)));
  });

  test('manager with hours-only edit sees locations nav item', () {
    const access = BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: [BusinessPermission.businessHoursEdit],
    );
    expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.locations));
  });

  test('owner role can edit locations nav regardless of explicit permissions list', () {
    const access = BusinessAccess(
      role: BusinessAccessRole.owner,
      permissions: const [],
    );
    expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.locations));
  });
}
