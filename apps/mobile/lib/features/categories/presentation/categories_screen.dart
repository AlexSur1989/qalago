import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import 'category_businesses_screen.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final city = ref.watch(cityProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
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
                onNotificationsTap: () => context.push('/notifications'),
              ),
              const SizedBox(height: 20),
              TextField(
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Поиск категорий...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Color(0xFF8A919F),
                  ),
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
              categoriesAsync.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(
                  message: '$e',
                  onRetry: () => ref.invalidate(categoriesProvider),
                ),
                data: (categories) => _CategoriesGrid(categories: categories),
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
    required this.onNotificationsTap,
  });

  final String cityName;
  final AsyncValue<int> unreadAsync;
  final VoidCallback onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: const QalaGoLogo(fontSize: 38, fit: true),
        ),
        const SizedBox(width: 12),
        DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.black.withValues(alpha: 0.09)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
                const SizedBox(width: 6),
                Text(
                  cityName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Color(0xFF808796),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
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
    if (categories.isEmpty) {
      return const Center(child: Text('Категории пока не добавлены'));
    }

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
                        _categoryShortTitle(category),
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

String _categoryShortTitle(CategoryModel category) {
  switch (category.slug) {
    case 'food':
      return 'Еда';
    case 'bars':
      return 'Бары';
    case 'fitness':
      return 'Фитнес';
    case 'beauty':
      return 'Красота';
    case 'shops':
      return 'Магазины';
    case 'medicine':
      return 'Медицина';
    case 'kids':
      return 'Детям';
    case 'services':
      return 'Услуги';
    case 'fun':
      return 'Развлечения';
    case 'auto':
      return 'Авто';
    default:
      return category.title;
  }
}
