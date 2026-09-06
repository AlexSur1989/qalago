import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';

void main() {
  group('Stage 5G preview helpers', () {
    test('previewBlock reads nested preview payload', () {
      final data = {
        'catalogPreview': {
          'items': [{'id': '1', 'title': 'Phone'}],
          'totalCount': 300,
        },
      };
      final preview = previewBlock(data, 'catalogPreview');
      expect(preview?['totalCount'], 300);
      expect((preview?['items'] as List).length, 1);
    });

    test('shouldShowSeeAllAction when total exceeds preview', () {
      expect(shouldShowSeeAllAction(totalCount: 300, previewCount: 6), isTrue);
      expect(shouldShowSeeAllAction(totalCount: 4, previewCount: 6), isFalse);
    });

    test('reviewStatsFromPreview uses totalCount not preview length', () {
      final stats = reviewStatsFromPreview(
        [
          {'rating': 5},
          {'rating': 3},
        ],
        42,
      );
      expect(stats.$1, 4.0);
      expect(stats.$2, 42);
    });

    test('gallery preview bounded parsing', () {
      final data = {
        'galleryPreview': {
          'items': List.generate(6, (i) => {'imageUrl': 'https://cdn/$i.jpg'}),
          'totalCount': 100,
        },
      };
      final preview = previewBlock(data, 'galleryPreview');
      final items = preview?['items'] as List;
      expect(items.length, 6);
      expect(preview?['totalCount'], 100);
      expect(
        shouldShowSeeAllAction(
          totalCount: preview?['totalCount'] as int,
          previewCount: items.length,
        ),
        isTrue,
      );
    });
  });
}
