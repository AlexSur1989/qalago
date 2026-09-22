import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

class BusinessCatalogQuery {
  const BusinessCatalogQuery({
    required this.businessId,
    this.page = 1,
    this.sectionId,
    this.search,
    this.locationId,
  });

  final String businessId;
  final int page;
  final String? sectionId;
  final String? search;
  final String? locationId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BusinessCatalogQuery &&
          businessId == other.businessId &&
          page == other.page &&
          sectionId == other.sectionId &&
          search == other.search &&
          locationId == other.locationId;

  @override
  int get hashCode => Object.hash(businessId, page, sectionId, search, locationId);
}

final businessCatalogPageProvider =
    FutureProvider.family<Map<String, dynamic>, BusinessCatalogQuery>(
  (ref, query) async {
    return ref.watch(catalogRepositoryProvider).fetchBusinessCatalog(
          query.businessId,
          page: query.page,
          sectionId: query.sectionId,
          search: query.search,
          locationId: query.locationId,
        );
  },
);

class BusinessPhotosQuery {
  const BusinessPhotosQuery({
    required this.businessId,
    this.page = 1,
    this.locationId,
  });

  final String businessId;
  final int page;
  final String? locationId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BusinessPhotosQuery &&
          businessId == other.businessId &&
          page == other.page &&
          locationId == other.locationId;

  @override
  int get hashCode => Object.hash(businessId, page, locationId);
}

final businessPhotosPageProvider =
    FutureProvider.family<Map<String, dynamic>, BusinessPhotosQuery>(
  (ref, query) async {
    return ref.watch(catalogRepositoryProvider).fetchBusinessPhotos(
          query.businessId,
          page: query.page,
          locationId: query.locationId,
        );
  },
);
