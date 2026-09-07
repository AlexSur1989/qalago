import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../../shared/widgets/business_card.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  FavoriteSortMode _sort = FavoriteSortMode.recent;

  Future<void> _removeFavorite(String businessId) async {
    await ref.read(favoritesRepositoryProvider).remove(businessId);
    ref.invalidate(favoritesProvider);
    ref.invalidate(businessFavoriteProvider(businessId));
  }

  @override
  Widget build(BuildContext context) {
    final favoritesAsync = ref.watch(favoritesProvider);
    final city = ref.watch(cityProvider);
    final isAuthed = ref.watch(authProvider).isAuthenticated;

    if (!isAuthed) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _FavoritesHeader(
                  cityName: city.nameRu,
                  onCityTap: () => showCityPickerSheet(context, ref),
                ),
                const SizedBox(height: 48),
                const Expanded(child: _GuestFavoritesPrompt()),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
          onRefresh: () async => ref.invalidate(favoritesProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            children: [
              _FavoritesHeader(
                cityName: city.nameRu,
                onCityTap: () => showCityPickerSheet(context, ref),
              ),
              const SizedBox(height: 28),
              const Text(
                'Избранное',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  const Text(
                    'Сортировка:',
                    style: TextStyle(
                      color: Color(0xFF7B8291),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<FavoriteSortMode>(
                      value: _sort,
                      items: const [
                        DropdownMenuItem(
                          value: FavoriteSortMode.recent,
                          child: Text('Недавние'),
                        ),
                        DropdownMenuItem(
                          value: FavoriteSortMode.name,
                          child: Text('По названию'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() => _sort = value);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              favoritesAsync.when(
                loading: () => const LoadingView(),
                error: (_, __) => ErrorView(
                  message: 'Не удалось загрузить избранное.',
                  onRetry: () => ref.invalidate(favoritesProvider),
                ),
                data: (allItems) {
                  if (allItems.isEmpty) {
                    return const _EmptyFavoritesAll();
                  }

                  final cityItems = filterFavoritesByCity(allItems, city.slug);
                  if (cityItems.isEmpty) {
                    return _EmptyFavoritesInCity(cityName: city.nameRu);
                  }

                  final sorted = sortFavorites(cityItems, _sort);
                  final businesses = sorted
                      .map(
                        (item) =>
                            item['business'] as Map<String, dynamic>?,
                      )
                      .whereType<Map<String, dynamic>>()
                      .map(BusinessModel.fromJson)
                      .toList();

                  return Column(
                    children: [
                      for (final business in businesses) ...[
                        Stack(
                          children: [
                            BusinessCard(
                              business: business,
                              onTap: () =>
                                  openBusiness(
                                    context,
                                    business.id,
                                    BusinessTrafficSource.favorites,
                                  ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Material(
                                color: Colors.white.withValues(alpha: 0.92),
                                shape: const CircleBorder(),
                                child: IconButton(
                                  tooltip: 'Убрать из избранного',
                                  onPressed: () =>
                                      _removeFavorite(business.id),
                                  icon: const Icon(
                                    Icons.favorite,
                                    color: AppTheme.kzBlue,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],
                    ],
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

class _FavoritesHeader extends StatelessWidget {
  const _FavoritesHeader({
    required this.cityName,
    required this.onCityTap,
  });

  final String cityName;
  final VoidCallback onCityTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: QalaGoLogo(fontSize: 36)),
        CityPill(cityName: cityName, onTap: onCityTap),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
        ),
      ],
    );
  }
}

class _GuestFavoritesPrompt extends StatelessWidget {
  const _GuestFavoritesPrompt();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        CircleAvatar(
          radius: 42,
          backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
          child: const Icon(
            Icons.favorite_border,
            color: AppTheme.kzBlue,
            size: 42,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Войдите, чтобы сохранять избранное',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Добавляйте места в избранное и возвращайтесь к ним в один тап.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF7B8291), height: 1.35),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => context.push(
            '/login?redirect=${Uri.encodeComponent('/favorites')}',
          ),
          child: const Text('Войти'),
        ),
      ],
    );
  }
}

class _EmptyFavoritesAll extends StatelessWidget {
  const _EmptyFavoritesAll();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 56),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
            child: const Icon(
              Icons.favorite_border,
              color: AppTheme.kzBlue,
              size: 42,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'У вас пока нет избранных мест',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Добавляйте места в избранное, чтобы быстро вернуться к ним.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF7B8291), height: 1.35),
          ),
        ],
      ),
    );
  }
}

class _EmptyFavoritesInCity extends StatelessWidget {
  const _EmptyFavoritesInCity({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 56),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
            child: const Icon(
              Icons.location_city_outlined,
              color: AppTheme.kzBlue,
              size: 42,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'В $cityName пока нет избранных мест',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Избранные из других городов сохранены — смените город, чтобы увидеть их.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF7B8291), height: 1.35),
          ),
        ],
      ),
    );
  }
}
