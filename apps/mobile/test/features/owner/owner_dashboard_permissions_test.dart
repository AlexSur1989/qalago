import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/features/owner/owner_dashboard_actions.dart';

void main() {
  const ownerAccess = BusinessAccess(
    role: BusinessAccessRole.owner,
    permissions: const [],
  );

  const catalogOnly = BusinessAccess(
    role: BusinessAccessRole.manager,
    permissions: [BusinessPermission.catalogEdit],
  );

  const profileOnly = BusinessAccess(
    role: BusinessAccessRole.manager,
    permissions: [BusinessPermission.businessProfileEdit],
  );

  const hoursOnly = BusinessAccess(
    role: BusinessAccessRole.manager,
    permissions: [BusinessPermission.businessHoursEdit],
  );

  test('owner sees all dashboard management actions including team', () {
    final visible = visibleOwnerDashboardActions(ownerAccess);
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.team));
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.menu));
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.reviews));
  });

  test('catalog-only manager sees menu but not profile edit or promotions', () {
    final visible = visibleOwnerDashboardActions(catalogOnly);
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.menu));
    expect(visible.map((d) => d.action), isNot(contains(OwnerDashboardAction.editProfile)));
    expect(visible.map((d) => d.action), isNot(contains(OwnerDashboardAction.promotions)));
    expect(visible.map((d) => d.action), isNot(contains(OwnerDashboardAction.team)));
  });

  test('profile-only manager sees edit profile and locations', () {
    final visible = visibleOwnerDashboardActions(profileOnly);
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.editProfile));
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.locations));
  });

  test('hours-only manager sees locations but not profile edit', () {
    final visible = visibleOwnerDashboardActions(hoursOnly);
    expect(visible.map((d) => d.action), contains(OwnerDashboardAction.locations));
    expect(visible.map((d) => d.action), isNot(contains(OwnerDashboardAction.editProfile)));
  });

  test('drawer locations nav aligns with dashboard (hours-only)', () {
    expect(canAccessOwnerNavItem(hoursOnly, OwnerNavItem.locations), isTrue);
    expect(canAccessOwnerNavItem(hoursOnly, OwnerNavItem.editProfile), isFalse);
  });

  test('monetization dashboard card requires ADS_MANAGE', () {
    expect(canShowOwnerMonetizationDashboardCard(catalogOnly), isFalse);
    expect(
      canShowOwnerMonetizationDashboardCard(
        const BusinessAccess(
          role: BusinessAccessRole.manager,
          permissions: [BusinessPermission.adsManage],
        ),
      ),
      isTrue,
    );
  });
}
