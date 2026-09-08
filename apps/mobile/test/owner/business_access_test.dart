import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';

MyBusinessEntry _entry({
  required String id,
  required BusinessAccessRole role,
  List<BusinessPermission> permissions = const [],
}) {
  return MyBusinessEntry(
    business: {'id': id, 'title': 'Business $id'},
    access: BusinessAccess(role: role, permissions: permissions),
  );
}

void main() {
  group('canAccessBusinessCabinet', () {
    test('USER with OWNER membership entries can access cabinet', () {
      final entries = [
        _entry(id: 'b1', role: BusinessAccessRole.owner),
      ];

      expect(canAccessBusinessCabinet('USER', entries), isTrue);
    });

    test('USER with MANAGER membership entries can access cabinet', () {
      final entries = [
        _entry(
          id: 'b1',
          role: BusinessAccessRole.manager,
          permissions: [BusinessPermission.catalogEdit],
        ),
      ];

      expect(canAccessBusinessCabinet('USER', entries), isTrue);
    });

    test('USER without entries cannot access cabinet', () {
      expect(canAccessBusinessCabinet('USER', const []), isFalse);
    });

    test('BUSINESS role can access cabinet without entries', () {
      expect(canAccessBusinessCabinet('BUSINESS', const []), isTrue);
    });
  });

  group('permission filtering', () {
    test('OWNER sees all drawer nav items', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.owner,
        permissions: const [],
      );

      expect(
        filterOwnerNavByPermission(access),
        containsAll(OwnerNavItem.values),
      );
    });

    test('MANAGER with CATALOG_EDIT only sees allowed nav', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: const [BusinessPermission.catalogEdit],
      );

      final allowed = filterOwnerNavByPermission(access);

      expect(allowed, contains(OwnerNavItem.overview));
      expect(allowed, contains(OwnerNavItem.menu));
      expect(allowed, contains(OwnerNavItem.messages));
      expect(allowed, contains(OwnerNavItem.settings));
      expect(allowed, contains(OwnerNavItem.help));
      expect(allowed, isNot(contains(OwnerNavItem.analytics)));
      expect(allowed, isNot(contains(OwnerNavItem.promote)));
      expect(allowed, isNot(contains(OwnerNavItem.plan)));
    });

    test('MANAGER with PAYMENTS_VIEW sees plan nav', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: const [BusinessPermission.paymentsView],
      );

      expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.plan));
    });

    test('MANAGER without PAYMENTS_VIEW hides plan nav', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: const [BusinessPermission.adsManage],
      );

      expect(filterOwnerNavByPermission(access), isNot(contains(OwnerNavItem.plan)));
    });

    test('ANALYTICS_EXPORT implies ANALYTICS_VIEW for hasPermission', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: const [BusinessPermission.analyticsExport],
      );

      expect(hasPermission(access, BusinessPermission.analyticsView), isTrue);
      expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.analytics));
    });
  });

  group('business switch', () {
    test('selected entry access drives nav filtering', () {
      final entries = [
        _entry(
          id: 'b1',
          role: BusinessAccessRole.manager,
          permissions: [BusinessPermission.catalogEdit],
        ),
        _entry(
          id: 'b2',
          role: BusinessAccessRole.manager,
          permissions: [
            BusinessPermission.analyticsView,
            BusinessPermission.adsManage,
          ],
        ),
      ];

      final firstAccess = entries.first.access;
      final secondAccess = entries[1].access;

      expect(filterOwnerNavByPermission(firstAccess), isNot(contains(OwnerNavItem.analytics)));
      expect(filterOwnerNavByPermission(secondAccess), contains(OwnerNavItem.analytics));
      expect(filterOwnerNavByPermission(secondAccess), contains(OwnerNavItem.promote));
    });

    test('isOwner is true for OWNER role only among membership roles', () {
      expect(
        isOwner(BusinessAccess(role: BusinessAccessRole.owner, permissions: const [])),
        isTrue,
      );
      expect(
        isOwner(
          BusinessAccess(
            role: BusinessAccessRole.manager,
            permissions: const [BusinessPermission.paymentsView],
          ),
        ),
        isFalse,
      );
    });
  });

  group('MyBusinessEntry parsing', () {
    test('fromJson parses access context from API payload', () {
      final entry = MyBusinessEntry.fromJson({
        'business': {'id': 'b1', 'title': 'Cafe'},
        'access': {
          'role': 'MANAGER',
          'permissions': ['CATALOG_EDIT', 'ANALYTICS_VIEW'],
        },
      });

      expect(entry.businessId, 'b1');
      expect(entry.access.role, BusinessAccessRole.manager);
      expect(entry.access.permissions, [
        BusinessPermission.catalogEdit,
        BusinessPermission.analyticsView,
      ]);
    });
  });
}
