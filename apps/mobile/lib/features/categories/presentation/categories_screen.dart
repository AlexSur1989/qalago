import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/locale/consumer_api_errors.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_components.dart';
import '../../../shared/widgets/qalago_search_field.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/presentation/home_layout.dart';
import '../../home/presentation/sections/home_header_section.dart';
import '../../../shared/widgets/category_icon_tile.dart';
import '../data/category_directory_layout.dart';
import '../utils/category_display.dart';
import 'category_businesses_screen.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CategoryModel> _filterCategories(
    List<CategoryModel> categories,
    String localeCode,
  ) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return categories;
    return categories.where((c) {
      final label =
          categoryDisplayName(c, localeCode: localeCode).toLowerCase();
      return label.contains(q) ||
          c.nameRu.toLowerCase().contains(q) ||
          c.nameKk.toLowerCase().contains(q) ||
          c.slug.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final city = ref.watch(cityProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);
    final catalogTotalAsync = ref.watch(cityCatalogTotalProvider);
    final isEmptyCity =
        catalogTotalAsync.hasValue && catalogTotalAsync.value == 0;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final cityName = ref.watch(cityLocalizedNameProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(cityCatalogTotalProvider);
            ref.invalidate(unreadNotificationsProvider);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              HomeLayout.horizontalPadding,
              HomeLayout.topPadding,
              HomeLayout.horizontalPadding,
              HomeLayout.bottomPadding,
            ),
            children: [
              HomeHeaderSection(
                cityName: cityName,
                unreadAsync: unreadAsync,
                onCityTap: () => showCityPickerSheet(context, ref),
                onNotificationsTap: () => context.push('/notifications'),
              ),
              const SizedBox(height: HomeLayout.blockGap),
              QalagoSearchField(
                controller: _searchController,
                textInputAction: TextInputAction.search,
                hintText: l10n.categoriesFilterHint,
                onChanged: (value) => setState(() => _query = value),
                onSubmitted: (value) {
                  final q = value.trim();
                  if (q.isEmpty) return;
                  context.push('/search?q=${Uri.encodeComponent(q)}');
                },
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        tooltip: l10n.searchClearTooltip,
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                        icon: Icon(
                          Icons.cancel,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: QalaGoSpacing.space12),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    minimumSize: const Size(
                      QalaGoTouchTargets.minInteractive,
                      QalaGoTouchTargets.minInteractive,
                    ),
                  ),
                  onPressed: () => context.push('/search'),
                  icon: const Icon(Icons.storefront_outlined),
                  label: Text(l10n.categoriesSearchBusinesses),
                ),
              ),
              const SizedBox(height: QalaGoSpacing.space12),
              QalaGoPageTitle(text: l10n.categoriesTitle),
              const SizedBox(height: QalaGoSpacing.space4),
              Text(
                cityName,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: HomeLayout.sectionGap),
              if (catalogTotalAsync.isLoading && !catalogTotalAsync.hasValue)
                const LoadingView()
              else if (isEmptyCity)
                EmptyCityView(
                  cityName: cityName,
                  isComingSoon: city.isComingSoon,
                  onPickCity: () => showCityPickerSheet(context, ref),
                )
              else
                categoriesAsync.when(
                  loading: () => const LoadingView(),
                  error: (e, _) => ErrorView(
                    message: localizedLoadError(l10n, e),
                    onRetry: () => ref.invalidate(categoriesProvider),
                  ),
                  data: (categories) {
                    final filtered =
                        _filterCategories(categories, localeCode);
                    if (filtered.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.all(QalaGoSpacing.space24),
                        child: Center(child: Text(l10n.categoriesNotFound)),
                      );
                    }
                    return _CategoriesDirectoryGrid(
                      key: const Key('categories_directory_grid'),
                      categories: filtered,
                      localeCode: localeCode,
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoriesDirectoryGrid extends StatelessWidget {
  const _CategoriesDirectoryGrid({
    super.key,
    required this.categories,
    required this.localeCode,
  });

  final List<CategoryModel> categories;
  final String localeCode;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = categoryDirectoryGridColumns(constraints.maxWidth);
        const spacing = QalaGoSpacing.space8;
        final itemWidth =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final category in categories)
              SizedBox(
                width: itemWidth,
                child: CategoryIconTile(
                  label: categoryDisplayName(
                    category,
                    localeCode: localeCode,
                  ),
                  iconPath: category.icon,
                  onTap: () => openCategory(
                    context,
                    category,
                    localeCode: localeCode,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
