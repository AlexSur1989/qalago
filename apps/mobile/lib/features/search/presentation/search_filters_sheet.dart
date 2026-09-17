import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../../categories/utils/category_display.dart';
import '../search_filters.dart';
import 'search_filter_sections.dart';

Future<void> showSearchFiltersSheet({
  required BuildContext context,
  required WidgetRef ref,
  required List<CategoryModel> categories,
  required String localeCode,
  required String? categoryId,
  required String? subcategoryId,
  required SearchRadiusMode radiusMode,
  required void Function(
    String? categoryId,
    String? subcategoryId,
    SearchRadiusMode radiusMode,
  ) onApply,
  required VoidCallback onResetFilters,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (context) {
      return _SearchFiltersSheetBody(
        ref: ref,
        categories: categories,
        localeCode: localeCode,
        initialCategoryId: categoryId,
        initialSubcategoryId: subcategoryId,
        initialRadius: radiusMode,
        onApply: onApply,
        onResetFilters: onResetFilters,
      );
    },
  );
}

class _SearchFiltersSheetBody extends ConsumerStatefulWidget {
  const _SearchFiltersSheetBody({
    required this.ref,
    required this.categories,
    required this.localeCode,
    required this.initialCategoryId,
    required this.initialSubcategoryId,
    required this.initialRadius,
    required this.onApply,
    required this.onResetFilters,
  });

  final WidgetRef ref;
  final List<CategoryModel> categories;
  final String localeCode;
  final String? initialCategoryId;
  final String? initialSubcategoryId;
  final SearchRadiusMode initialRadius;
  final void Function(
    String? categoryId,
    String? subcategoryId,
    SearchRadiusMode radiusMode,
  ) onApply;
  final VoidCallback onResetFilters;

  @override
  ConsumerState<_SearchFiltersSheetBody> createState() =>
      _SearchFiltersSheetBodyState();
}

class _SearchFiltersSheetBodyState extends ConsumerState<_SearchFiltersSheetBody> {
  late String? _categoryId;
  late String? _subcategoryId;
  late SearchRadiusMode _radiusMode;

  @override
  void initState() {
    super.initState();
    _categoryId = widget.initialCategoryId;
    _subcategoryId = widget.initialSubcategoryId;
    _radiusMode = widget.initialRadius;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final subcategoriesAsync = _categoryId == null
        ? const AsyncValue.data(<SubcategoryModel>[])
        : ref.watch(subcategoriesProvider(_categoryId!));

    return Padding(
      padding: EdgeInsets.only(
        left: QalaGoSpacing.space16,
        right: QalaGoSpacing.space16,
        bottom: MediaQuery.viewInsetsOf(context).bottom + QalaGoSpacing.space16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.searchFiltersTitle,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            Text(
              l10n.navCategories,
              style: const TextStyle(
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space8),
            SearchCategoryFilterWrap(
              categories: widget.categories,
              selectedId: _categoryId,
              localeCode: widget.localeCode,
              onSelected: (id) {
                setState(() {
                  _categoryId = id;
                  _subcategoryId = null;
                });
              },
            ),
            subcategoriesAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(QalaGoSpacing.space8),
                child: LinearProgressIndicator(minHeight: 2),
              ),
              error: (_, _) => const SizedBox.shrink(),
              data: (subs) {
                if (_categoryId == null || subs.isEmpty) {
                  return const SizedBox.shrink();
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: QalaGoSpacing.space12),
                    Text(
                      l10n.searchSubcategoriesTitle,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: QalaGoSpacing.space8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        FilterChip(
                          label: Text(l10n.searchSubcategoryAll),
                          selected: _subcategoryId == null,
                          onSelected: (_) =>
                              setState(() => _subcategoryId = null),
                          selectedColor:
                              AppTheme.kzBlue.withValues(alpha: 0.15),
                          checkmarkColor: AppTheme.kzBlue,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                        ),
                        for (final sub in subs)
                          FilterChip(
                            label: Text(
                              sub.displayName(localeCode: widget.localeCode),
                            ),
                            selected: _subcategoryId == sub.id,
                            onSelected: (_) =>
                                setState(() => _subcategoryId = sub.id),
                            selectedColor:
                                AppTheme.kzBlue.withValues(alpha: 0.15),
                            checkmarkColor: AppTheme.kzBlue,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            Text(
              l10n.searchRadiusSectionTitle,
              style: const TextStyle(
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space8),
            SearchRadiusFilterWrap(
              selected: _radiusMode,
              l10n: l10n,
              onSelected: (mode) => setState(() => _radiusMode = mode),
            ),
            const SizedBox(height: QalaGoSpacing.space16),
            SizedBox(
              height: QalaGoTouchTargets.minInteractive,
              child: FilledButton(
                onPressed: () {
                  widget.onApply(_categoryId, _subcategoryId, _radiusMode);
                  Navigator.of(context).pop();
                },
                child: Text(l10n.searchApplyFilters),
              ),
            ),
            TextButton(
              onPressed: () {
                widget.onResetFilters();
                Navigator.of(context).pop();
              },
              child: Text(l10n.searchResetFiltersOnly),
            ),
          ],
        ),
      ),
    );
  }
}
