import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_menu_utils.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/features/owner/providers/owner_menu_provider.dart';

void main() {
  group('ownerMenuHasMore', () {
    test('true when page < totalPages', () {
      expect(
        ownerMenuHasMore({'page': 1, 'totalPages': 15}),
        isTrue,
      );
    });

    test('false on final page', () {
      expect(
        ownerMenuHasMore({'page': 15, 'totalPages': 15}),
        isFalse,
      );
    });
  });

  group('mergeOwnerMenuItems', () {
    test('appends only new ids', () {
      final merged = mergeOwnerMenuItems(
        [
          {'id': 'a', 'title': 'A'},
        ],
        [
          {'id': 'a', 'title': 'A dup'},
          {'id': 'b', 'title': 'B'},
        ],
      );
      expect(merged, hasLength(2));
      expect(merged.map((e) => e['id']), ['a', 'b']);
    });
  });

  group('ownerMenuEmptyMessage', () {
    final ru = lookupAppLocalizations(const Locale('ru'));

    test('empty business message', () {
      expect(
        ownerMenuEmptyMessage(ru, totalCount: 0, search: null, sectionId: null),
        ru.ownerMenuEmpty,
      );
    });

    test('empty search message', () {
      expect(
        ownerMenuEmptyMessage(ru, totalCount: 0, search: 'iphone', sectionId: null),
        ru.catalogNotFound,
      );
    });

    test('empty section message', () {
      expect(
        ownerMenuEmptyMessage(ru, totalCount: 0, search: null, sectionId: 'sec-1'),
        ru.ownerMenuEmpty,
      );
    });
  });

  group('OwnerMenuItemsQuery', () {
    test('different businessId is not equal', () {
      const a = OwnerMenuItemsQuery(businessId: 'biz-a', page: 1);
      const b = OwnerMenuItemsQuery(businessId: 'biz-b', page: 1);
      expect(a == b, isFalse);
    });

    test('search change is not equal', () {
      const a = OwnerMenuItemsQuery(businessId: 'biz-a', search: 'phone');
      const b = OwnerMenuItemsQuery(businessId: 'biz-a', search: 'case');
      expect(a == b, isFalse);
    });

    test('default page size is 20', () {
      const q = OwnerMenuItemsQuery(businessId: 'biz-a');
      expect(q.limit, 20);
      expect(q.page, 1);
    });
  });

  group('VIP scale acceptance', () {
    test('first page only implies hasMore for 300 items', () {
      final pagination = {'page': 1, 'totalPages': 15, 'total': 300, 'limit': 20};
      expect(ownerMenuHasMore(pagination), isTrue);
      expect(pagination['total'], 300);
    });
  });
}
