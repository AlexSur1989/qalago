import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../shared/widgets/category_icon_tile.dart';
import '../../../shared/widgets/qalago_loading.dart';
import '../data/category_directory_layout.dart';
import 'category_subcategory_filter.dart';

class SubcategoryIconGrid extends ConsumerWidget {
  const SubcategoryIconGrid({
    super.key,
    required this.categoryId,
  });

  final String categoryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final selected = ref.watch(categorySubcategoryFilterProvider(categoryId));
    final subsAsync = ref.watch(categorySubcategoriesProvider(categoryId));

    return subsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: QalaGoSpacing.space12),
        child: Center(
          child: SizedBox(
            height: 48,
            child: QalaGoLoadingIndicator(),
          ),
        ),
      ),
      error: (e, _) {
        assert(() {
          debugPrint('[QalaGo Category] subcategories error: $e');
          return true;
        }());
        return Padding(
          padding: const EdgeInsets.only(bottom: QalaGoSpacing.space12),
          child: Text(
            l10n.categorySubcategoriesError,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        );
      },
      data: (subs) {
        if (subs.isEmpty) return const SizedBox.shrink();
        return LayoutBuilder(
          builder: (context, constraints) {
            final columns = categoryDirectoryGridColumns(constraints.maxWidth);
            const spacing = QalaGoSpacing.space8;
            final itemWidth =
                (constraints.maxWidth - spacing * (columns - 1)) / columns;
            final allLabel = l10n.categoryAllBusinesses;
            return Padding(
              padding: const EdgeInsets.only(bottom: QalaGoSpacing.space12),
              child: Wrap(
                key: const Key('subcategory_icon_grid'),
                spacing: spacing,
                runSpacing: spacing,
                children: [
                  SizedBox(
                    width: itemWidth,
                    child: CategoryIconTile(
                      label: allLabel,
                      semanticsLabel: allLabel,
                      selected: selected == null,
                      onTap: () {
                        ref
                            .read(
                              categorySubcategoryFilterProvider(categoryId)
                                  .notifier,
                            )
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
                        selected: selected == sub.id,
                        onTap: () {
                          ref
                              .read(
                                categorySubcategoryFilterProvider(categoryId)
                                    .notifier,
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
