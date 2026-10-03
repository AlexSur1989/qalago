import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_utils.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('owner profile / business JSON null-safety (6.14O.1A)', () {
    test('BusinessModel accepts null or missing address (BL geo retirement)', () {
      for (final json in [
        {
          'id': 'biz-aktobe',
          'title': 'Aktobe Coffee Lab',
          'slug': 'aktobe-coffee-lab',
          'address': null,
        },
        {
          'id': 'biz-aktobe',
          'title': 'Aktobe Coffee Lab',
          'slug': 'aktobe-coffee-lab',
        },
      ]) {
        final model = BusinessModel.fromJson(json);
        expect(model.title, 'Aktobe Coffee Lab');
        expect(model.address, '');
      }
    });

    test('PromotionModel nested owner business without address parses', () {
      final promo = PromotionModel.fromJson({
        'id': 'promo-1',
        'title': 'Happy hour',
        'business': {
          'id': 'biz-aktobe',
          'title': 'Aktobe Coffee Lab',
          'slug': 'aktobe-coffee-lab',
          'coverImageUrl': null,
        },
      });
      expect(promo.business?.address, '');
      expect(promo.business?.title, 'Aktobe Coffee Lab');
    });

    test('nullable contact fields on business map do not break profile completion', () {
      final percent = ownerProfileCompletion({
        'title': 'Aktobe Coffee Lab',
        'shortDesc': null,
        'description': null,
        'address': null,
        'phone': null,
        'whatsapp': null,
        'instagram': null,
        'website': null,
        'coverImageUrl': null,
      });
      expect(percent, greaterThanOrEqualTo(0));
      expect(percent, lessThanOrEqualTo(100));
    });

    test('SubcategoryModel tolerates null nameKk in API payload', () {
      final sub = SubcategoryModel.fromJson({
        'id': 'sub-1',
        'categoryId': 'cat-1',
        'slug': 'coffee',
        'nameRu': 'Кофе',
        'nameKk': null,
      });
      expect(sub.nameRu, 'Кофе');
      expect(sub.nameKk, 'Кофе');
    });
  });
}
