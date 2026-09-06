import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

class OwnerMenuItemsQuery {
  const OwnerMenuItemsQuery({
    required this.businessId,
    this.page = 1,
    this.sectionId,
    this.search,
    this.limit = 20,
  });

  final String businessId;
  final int page;
  final String? sectionId;
  final String? search;
  final int limit;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OwnerMenuItemsQuery &&
          businessId == other.businessId &&
          page == other.page &&
          sectionId == other.sectionId &&
          search == other.search &&
          limit == other.limit;

  @override
  int get hashCode => Object.hash(businessId, page, sectionId, search, limit);
}

final ownerMenuItemsPageProvider =
    FutureProvider.family<Map<String, dynamic>, OwnerMenuItemsQuery>(
  (ref, query) async {
    return ref.watch(catalogRepositoryProvider).fetchManageMenuItems(
          query.businessId,
          page: query.page,
          limit: query.limit,
          sectionId: query.sectionId,
          search: query.search,
        );
  },
);
