import '../../../shared/models/models.dart';

String categoryDisplayName(CategoryModel category, {required String localeCode}) {
  return category.displayName(localeCode: localeCode);
}
