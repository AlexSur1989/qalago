/// Consumer effective media (Stage 6.12A.7.7.5) — backend A.7.7.3 is source of truth.
library;

import 'business_detail_utils.dart';

enum EffectiveMediaImageScope { brand, branch }

class EffectiveMediaItem {
  const EffectiveMediaItem({
    required this.id,
    required this.imageUrl,
    required this.sortOrder,
    this.locationId,
    required this.scope,
  });

  final String id;
  final String imageUrl;
  final int sortOrder;
  final String? locationId;
  final EffectiveMediaImageScope scope;

  static EffectiveMediaItem? fromJson(Map<String, dynamic> json) {
    final id = json['id'] as String?;
    final imageUrl = json['imageUrl'] as String?;
    if (id == null || imageUrl == null) return null;
    final scopeRaw = json['scope'] as String?;
    final scope = scopeRaw == 'branch'
        ? EffectiveMediaImageScope.branch
        : EffectiveMediaImageScope.brand;
    return EffectiveMediaItem(
      id: id,
      imageUrl: imageUrl,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      locationId: json['locationId'] as String?,
      scope: scope,
    );
  }
}

class EffectiveMediaBundle {
  const EffectiveMediaBundle({
    this.activeLocationId,
    this.coverImageUrl,
    required this.galleryItems,
    required this.galleryTotalCount,
  });

  final String? activeLocationId;
  final String? coverImageUrl;
  final List<EffectiveMediaItem> galleryItems;
  final int galleryTotalCount;

  static EffectiveMediaBundle? fromDetail(Map<String, dynamic> data) {
    final block = previewBlock(data, 'effectiveMedia');
    if (block == null) return null;

    final preview = previewBlock(block, 'galleryPreview');
    final rawItems = (preview?['items'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .map(EffectiveMediaItem.fromJson)
        .whereType<EffectiveMediaItem>()
        .toList();

    final total = preview?['totalCount'] as int? ?? rawItems.length;

    return EffectiveMediaBundle(
      activeLocationId: block['activeLocationId'] as String?,
      coverImageUrl: block['coverImageUrl'] as String?,
      galleryItems: rawItems,
      galleryTotalCount: total,
    );
  }
}

/// Resolved media for detail UI (hero + strip + photos navigation).
class ConsumerDetailMediaPresentation {
  const ConsumerDetailMediaPresentation({
    required this.coverImageUrlRaw,
    required this.galleryItemsRaw,
    required this.galleryTotalCount,
    required this.photoCarouselUrls,
    this.photosLocationId,
    this.usedEffectiveMedia = false,
    this.activeLocationMismatch = false,
  });

  final String? coverImageUrlRaw;
  final List<Map<String, dynamic>> galleryItemsRaw;
  final int galleryTotalCount;
  final List<String> photoCarouselUrls;
  final String? photosLocationId;
  final bool usedEffectiveMedia;
  final bool activeLocationMismatch;
}

String? resolveDetailActiveLocationId(Map<String, dynamic> data) {
  return data['activeLocationId'] as String?;
}

/// When effectiveMedia.activeLocationId disagrees with top-level activeLocationId, trust top-level (A.7.6).
String? resolvePhotosLocationId({
  required Map<String, dynamic> data,
  EffectiveMediaBundle? effectiveMedia,
}) {
  final top = resolveDetailActiveLocationId(data);
  final mediaLoc = effectiveMedia?.activeLocationId;
  if (top != null &&
      top.isNotEmpty &&
      mediaLoc != null &&
      mediaLoc.isNotEmpty &&
      top != mediaLoc) {
    return top;
  }
  return mediaLoc ?? top;
}

bool effectiveMediaLocationMismatch({
  required Map<String, dynamic> data,
  EffectiveMediaBundle? effectiveMedia,
}) {
  final top = resolveDetailActiveLocationId(data);
  final mediaLoc = effectiveMedia?.activeLocationId;
  if (top == null || mediaLoc == null) return false;
  return top.isNotEmpty && mediaLoc.isNotEmpty && top != mediaLoc;
}

List<String> buildPhotoCarouselUrls({
  required String? coverImageUrlRaw,
  required List<Map<String, dynamic>> galleryItems,
  required String Function(String?) resolveUrl,
}) {
  final seenIds = <String>{};
  final seenUrls = <String>{};
  final urls = <String>[];

  void addItem({String? id, required String? rawUrl}) {
    final url = resolveUrl(rawUrl);
    if (url.isEmpty) return;
    if (id != null && id.isNotEmpty) {
      if (seenIds.contains(id)) return;
      seenIds.add(id);
    }
    if (seenUrls.contains(url)) return;
    seenUrls.add(url);
    urls.add(url);
  }

  addItem(rawUrl: coverImageUrlRaw);
  for (final item in galleryItems) {
    addItem(
      id: item['id'] as String?,
      rawUrl: item['imageUrl'] as String?,
    );
  }
  return urls;
}

ConsumerDetailMediaPresentation resolveConsumerDetailMedia(
  Map<String, dynamic> data,
) {
  final effective = EffectiveMediaBundle.fromDetail(data);
  final mismatch = effectiveMediaLocationMismatch(
    data: data,
    effectiveMedia: effective,
  );

  if (effective != null) {
    final galleryRaw = effective.galleryItems
        .map(
          (item) => {
            'id': item.id,
            'imageUrl': item.imageUrl,
            'sortOrder': item.sortOrder,
            'locationId': item.locationId,
            'scope': item.scope.name,
          },
        )
        .toList();

    final photoUrls = buildPhotoCarouselUrls(
      coverImageUrlRaw: effective.coverImageUrl,
      galleryItems: galleryRaw,
      resolveUrl: (raw) => raw?.trim() ?? '',
    );

    return ConsumerDetailMediaPresentation(
      coverImageUrlRaw: effective.coverImageUrl,
      galleryItemsRaw: galleryRaw,
      galleryTotalCount: effective.galleryTotalCount,
      photoCarouselUrls: photoUrls,
      photosLocationId: resolvePhotosLocationId(
        data: data,
        effectiveMedia: effective,
      ),
      usedEffectiveMedia: true,
      activeLocationMismatch: mismatch,
    );
  }

  final galleryPreview = previewBlock(data, 'galleryPreview');
  final galleryItems = (galleryPreview?['items'] as List<dynamic>? ??
          data['images'] as List<dynamic>? ??
          [])
      .cast<Map<String, dynamic>>();
  final galleryTotal =
      galleryPreview?['totalCount'] as int? ?? galleryItems.length;
  final coverRaw = data['coverImageUrl'] as String?;

  final galleryRaw = galleryItems
      .map((e) => Map<String, dynamic>.from(e))
      .toList();

  final photoUrls = buildPhotoCarouselUrls(
    coverImageUrlRaw: coverRaw,
    galleryItems: galleryRaw,
    resolveUrl: (raw) => raw?.trim() ?? '',
  );

  return ConsumerDetailMediaPresentation(
    coverImageUrlRaw: coverRaw,
    galleryItemsRaw: galleryRaw,
    galleryTotalCount: galleryTotal,
    photoCarouselUrls: photoUrls,
    photosLocationId: resolvePhotosLocationId(data: data),
    usedEffectiveMedia: false,
    activeLocationMismatch: false,
  );
}
