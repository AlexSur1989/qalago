import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
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

  List<CategoryModel> _filterCategories(List<CategoryModel> categories) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return categories;
    return categories
        .where(
          (c) =>
              c.title.toLowerCase().contains(q) ||
              c.slug.toLowerCase().contains(q),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);
    final catalogTotalAsync = ref.watch(cityCatalogTotalProvider);
    final isEmptyCity =
        catalogTotalAsync.hasValue && catalogTotalAsync.value == 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(cityCatalogTotalProvider);
            ref.invalidate(unreadNotificationsProvider);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            children: [
              _CategoriesHeader(
                cityName: city.nameRu,
                unreadAsync: unreadAsync,
                onCityTap: () => showCityPickerSheet(context, ref),
                onNotificationsTap: () => context.push('/notifications'),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _searchController,
                textInputAction: TextInputAction.search,
                onChanged: (value) => setState(() => _query = value),
                onSubmitted: (value) {
                  final q = value.trim();
                  if (q.isEmpty) return;
                  context.push('/search?q=${Uri.encodeComponent(q)}');
                },
                decoration: InputDecoration(
                  hintText: 'Поиск категорий...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Color(0xFF8A919F),
                  ),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          tooltip: 'Очистить',
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _query = '');
                          },
                          icon: const Icon(Icons.cancel, color: Color(0xFF8A919F)),
                        )
                      : null,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: Colors.black.withValues(alpha: 0.08),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: AppTheme.kzBlue,
                      width: 1.4,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (catalogTotalAsync.isLoading && !catalogTotalAsync.hasValue)
                const LoadingView()
              else if (isEmptyCity)
                EmptyCityView(
                  cityName: city.nameRu,
                  isComingSoon: city.isComingSoon,
                  onPickCity: () => showCityPickerSheet(context, ref),
                )
              else
                categoriesAsync.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(
                  message: '$e',
                  onRetry: () => ref.invalidate(categoriesProvider),
                ),
                data: (categories) {
                  final filtered = _filterCategories(categories);
                  if (filtered.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('Категории не найдены')),
                    );
                  }
                  return _CategoriesGrid(categories: filtered);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoriesHeader extends StatelessWidget {
  const _CategoriesHeader({
    required this.cityName,
    required this.unreadAsync,
    required this.onCityTap,
    required this.onNotificationsTap,
  });

  final String cityName;
  final AsyncValue<int> unreadAsync;
  final VoidCallback onCityTap;
  final VoidCallback onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: QalaGoLogo(fontSize: 38, fit: true)),
        const SizedBox(width: 12),
        CityPill(cityName: cityName, onTap: onCityTap),
        const SizedBox(width: 10),
        unreadAsync.when(
          data: (count) =>
              _NotificationButton(count: count, onTap: onNotificationsTap),
          loading: () =>
              _NotificationButton(count: 0, onTap: onNotificationsTap),
          error: (_, _) =>
              _NotificationButton(count: 0, onTap: onNotificationsTap),
        ),
      ],
    );
  }
}

class _NotificationButton extends StatelessWidget {
  const _NotificationButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Уведомления',
      onPressed: onTap,
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text('$count'),
        backgroundColor: AppTheme.kzGold,
        textColor: Colors.black,
        child: const Icon(
          Icons.notifications_none_rounded,
          size: 31,
          color: Colors.black,
        ),
      ),
    );
  }
}

class _CategoriesGrid extends StatelessWidget {
  const _CategoriesGrid({required this.categories});

  final List<CategoryModel> categories;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 720 ? 4 : 3;
        return GridView.builder(
          itemCount: categories.length,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.94,
          ),
          itemBuilder: (context, index) {
            final category = categories[index];
            final imageUrl = AppConstants.resolveMediaUrl(category.icon);
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => openCategory(context, category),
              child: Ink(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F2F5),
                  borderRadius: BorderRadius.circular(16),
                  image: imageUrl.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(imageUrl),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withValues(alpha: 0.7),
                        Colors.black.withValues(alpha: 0.06),
                      ],
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Align(
                      alignment: Alignment.bottomLeft,
                      child: Text(
                        category.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          height: 1.05,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
