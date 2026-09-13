import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../shared/widgets/category_icon_tile.dart';
import '../../../core/locale/l10n_extension.dart';
import 'category_subcategory_filter.dart';

class SubcategoryIconGrid extends ConsumerWidget {
  const SubcategoryIconGrid({
    super.key,
    required this.categoryId,
  });

  final String categoryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final subsAsync = ref.watch(categorySubcategoriesProvider(categoryId));
    return subsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (subs) {
        if (subs.isEmpty) return const SizedBox.shrink();
        return LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 720 ? 4 : 3;
            const spacing = 8.0;
            final itemWidth =
                (constraints.maxWidth - spacing * (columns - 1)) / columns;
            final allLabel = context.l10n.commonAll;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Wrap(
                spacing: spacing,
                runSpacing: spacing,
                children: [
                  SizedBox(
                    width: itemWidth,
                    child: CategoryIconTile(
                      label: allLabel,
                      onTap: () {
                        ref
                            .read(categorySubcategoryFilterProvider(categoryId).notifier)
                            .state = null;
                      },
                    ),
                  ),
                  for (final sub in subs)
                    SizedBox(
                      width: itemWidth,
                      child: CategoryIconTile(
                        label: sub.displayName(localeCode: localeCode),
                        iconPath: sub.icon,
                        onTap: () {
                          ref
                              .read(
                                categorySubcategoryFilterProvider(categoryId).notifier,
                              )
                              .state = sub.id;
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
