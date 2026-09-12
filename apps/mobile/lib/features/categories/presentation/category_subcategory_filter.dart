import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/release/app_config_provider.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/category_discovery_strings.dart';

final categorySubcategoriesProvider =
    FutureProvider.family<List<SubcategoryModel>, String>((ref, categoryId) async {
  return ref.watch(catalogRepositoryProvider).fetchSubcategories(categoryId);
});

/// Selected subcategory id; null means «Все».
final categorySubcategoryFilterProvider =
    StateProvider.family<String?, String>((ref, categoryId) => null);

class CategorySubcategoryFilterBar extends ConsumerWidget {
  const CategorySubcategoryFilterBar({
    super.key,
    required this.categoryId,
    this.localeCode = 'ru',
  });

  final String categoryId;
  final String localeCode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(subcategoriesEnabledProvider);
    if (!enabled) return const SizedBox.shrink();

    final subsAsync = ref.watch(categorySubcategoriesProvider(categoryId));
    return subsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (subs) {
        if (subs.isEmpty) return const SizedBox.shrink();
        final selected = ref.watch(categorySubcategoryFilterProvider(categoryId));
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(
                    CategoryDiscoveryStrings.sectionTitle(
                      CategoryDiscoveryStrings.subcategoryAll,
                      localeCode: localeCode,
                    ),
                  ),
                  selected: selected == null,
                  onSelected: (_) {
                    ref.read(categorySubcategoryFilterProvider(categoryId).notifier).state = null;
                  },
                ),
              ),
              for (final sub in subs)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(sub.displayName(localeCode: localeCode)),
                    selected: selected == sub.id,
                    onSelected: (_) {
                      ref.read(categorySubcategoryFilterProvider(categoryId).notifier).state =
                          sub.id;
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
