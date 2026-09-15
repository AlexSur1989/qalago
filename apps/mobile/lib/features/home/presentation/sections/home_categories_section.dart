import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../core/theme/qalago_spacing.dart';
import '../../../../core/theme/qalago_touch_targets.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/category_icon_tile.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../categories/data/home_category_display.dart';
import '../../../categories/utils/category_display.dart';

class HomeCategoriesSection extends ConsumerWidget {
  const HomeCategoriesSection({
    super.key,
    required this.localeCode,
    required this.onCategorySelected,
  });

  final String localeCode;
  final ValueChanged<CategoryModel> onCategorySelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final categoriesAsync = ref.watch(categoriesProvider);

    return categoriesAsync.when(
      loading: () => const SizedBox(height: 130, child: LoadingView()),
      error: (e, _) {
        assert(() {
          debugPrint('[QalaGo Home] categories error: $e');
          return true;
        }());
        return ErrorView(
          message: localizedLoadError(l10n, e),
          onRetry: () => ref.invalidate(categoriesProvider),
        );
      },
      data: (categories) => _HomeCategoryGrid(
        key: const Key('home_section_categories'),
        categories: categories,
        localeCode: localeCode,
        onSelected: onCategorySelected,
        onAllCategories: () => context.push('/categories'),
      ),
    );
  }
}

class _HomeCategoryGrid extends StatelessWidget {
  const _HomeCategoryGrid({
    super.key,
    required this.categories,
    required this.localeCode,
    required this.onSelected,
    required this.onAllCategories,
  });

  final List<CategoryModel> categories;
  final String localeCode;
  final ValueChanged<CategoryModel> onSelected;
  final VoidCallback onAllCategories;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return SizedBox(
        height: 100,
        child: Center(child: Text(context.l10n.homeCategoriesEmpty)),
      );
    }

    final slice = sliceHomeCategories(categories);

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = homeCategoryGridColumns(constraints.maxWidth);
        const spacing = 6.0;
        final itemWidth =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              spacing: spacing,
              runSpacing: 4,
              children: [
                for (final category in slice.preview)
                  SizedBox(
                    width: itemWidth,
                    child: CategoryIconTile(
                      label: categoryDisplayName(
                        category,
                        localeCode: localeCode,
                      ),
                      iconPath: category.icon,
                      onTap: () => onSelected(category),
                    ),
                  ),
              ],
            ),
            if (slice.showAllCategories) ...[
              const SizedBox(height: QalaGoSpacing.space8),
              _AllCategoriesAction(onTap: onAllCategories),
            ],
          ],
        );
      },
    );
  }
}

class _AllCategoriesAction extends StatelessWidget {
  const _AllCategoriesAction({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Semantics(
      button: true,
      label: l10n.commonAllCategories,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: QalaGoTouchTargets.minInteractive,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: QalaGoSpacing.space4,
                vertical: QalaGoSpacing.space8,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.grid_view_rounded,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: QalaGoSpacing.space8),
                  Flexible(
                    child: Text(
                      l10n.commonAllCategories,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
