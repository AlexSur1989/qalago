import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/business_card.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

final categoryBusinessesProvider =
    FutureProvider.family<PaginatedBusinesses, String>((ref, categoryId) async {
  final city = ref.watch(cityProvider);
  final userPosition = ref.watch(userLocationProvider).valueOrNull;
  return ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        categoryId: categoryId,
        latitude: userPosition?.latitude,
        longitude: userPosition?.longitude,
        radiusKm: 15,
      );
});

class CategoryBusinessesScreen extends ConsumerWidget {
  const CategoryBusinessesScreen({
    super.key,
    required this.categoryId,
    required this.categoryTitle,
  });

  final String categoryId;
  final String categoryTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessesAsync = ref.watch(categoryBusinessesProvider(categoryId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(categoryTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/categories');
            }
          },
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.kzBlue,
        onRefresh: () async {
          ref.invalidate(categoryBusinessesProvider(categoryId));
        },
        child: businessesAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(categoryBusinessesProvider(categoryId)),
              ),
            ],
          ),
          data: (data) {
            final featured = data.items.where((b) => b.isFeatured).toList();
            final regular = data.items.where((b) => !b.isFeatured).toList();

            if (data.items.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: const [
                  SizedBox(height: 80),
                  Center(child: Text('В этой категории пока нет заведений')),
                ],
              );
            }

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                if (featured.isNotEmpty) ...[
                  const _SectionTitle(
                    title: 'VIP · Топ',
                    subtitle: 'Рекомендуемые заведения',
                  ),
                  const SizedBox(height: 12),
                  ...featured.map(
                    (business) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: BusinessCard(
                        business: business,
                        onTap: () => context.push('/business/${business.id}'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                _SectionTitle(
                  title: featured.isEmpty ? 'Заведения' : 'Все заведения',
                  subtitle: '${data.items.length} ${_pluralPlaces(data.items.length)}',
                ),
                const SizedBox(height: 12),
                if (regular.isEmpty && featured.isNotEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'Других заведений в этой категории пока нет',
                      style: TextStyle(color: Colors.black54),
                    ),
                  )
                else
                  ...regular.map(
                    (business) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: BusinessCard(
                        business: business,
                        onTap: () => context.push('/business/${business.id}'),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  static String _pluralPlaces(int count) {
    final mod10 = count % 10;
    final mod100 = count % 100;
    if (mod10 == 1 && mod100 != 11) return 'место';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return 'места';
    }
    return 'мест';
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: Colors.black,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: TextStyle(color: Colors.black.withValues(alpha: 0.55)),
          ),
        ],
      ],
    );
  }
}

String categoryDisplayTitle(CategoryModel category) {
  switch (category.slug) {
    case 'food':
      return 'Рестораны и кафе';
    case 'bars':
      return 'Бары и караоке';
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

void openCategory(BuildContext context, CategoryModel category) {
  final title = categoryDisplayTitle(category);
  context.push(
    '/categories/${category.id}?title=${Uri.encodeComponent(title)}',
  );
}
