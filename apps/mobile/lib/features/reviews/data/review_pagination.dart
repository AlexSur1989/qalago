import '../../../shared/models/models.dart';

class PaginatedReviews {
  PaginatedReviews({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  final List<ReviewModel> items;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  factory PaginatedReviews.fromJson(Map<String, dynamic> json) {
    final pagination = json['pagination'] as Map<String, dynamic>? ?? {};
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return PaginatedReviews(
      items: rawItems
          .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      page: (pagination['page'] as num?)?.toInt() ?? 1,
      limit: (pagination['limit'] as num?)?.toInt() ?? rawItems.length,
      total: (pagination['total'] as num?)?.toInt() ?? rawItems.length,
      totalPages: (pagination['totalPages'] as num?)?.toInt() ?? 1,
    );
  }

  bool get hasMore => page < totalPages;
}

List<ReviewModel> mergeReviewPages(
  List<ReviewModel> existing,
  List<ReviewModel> nextPage,
) {
  final seen = existing.map((e) => e.id).toSet();
  final merged = [...existing];
  for (final review in nextPage) {
    if (seen.add(review.id)) {
      merged.add(review);
    }
  }
  return merged;
}
