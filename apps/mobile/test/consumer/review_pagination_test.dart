import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/reviews/data/review_pagination.dart';
import 'package:qalago_mobile/shared/models/models.dart';

ReviewModel _review(String id) => ReviewModel(
      id: id,
      rating: 5,
      createdAt: '2026-01-01T00:00:00.000Z',
    );

void main() {
  test('mergeReviewPages deduplicates by id', () {
    final merged = mergeReviewPages(
      [_review('a'), _review('b')],
      [_review('b'), _review('c')],
    );
    expect(merged.map((e) => e.id).toList(), ['a', 'b', 'c']);
  });

  test('PaginatedReviews parses envelope', () {
    final page = PaginatedReviews.fromJson({
      'items': [
        {
          'id': 'r1',
          'rating': 4,
          'createdAt': '2026-01-01T00:00:00.000Z',
          'user': {'id': 'u1', 'name': 'Ann'},
        },
      ],
      'pagination': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1},
    });
    expect(page.items.single.id, 'r1');
    expect(page.total, 1);
    expect(page.hasMore, isFalse);
  });
}
