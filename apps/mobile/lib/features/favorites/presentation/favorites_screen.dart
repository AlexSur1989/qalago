import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/locale/l10n_extension.dart';

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
    final l10n = context.l10n;
    final favoritesAsync = ref.watch(favoritesProvider);
    final city = ref.watch(cityProvider);
    final isAuthed = ref.watch(authProvider).isAuthenticated;

    if (!isAuthed) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _FavoritesHeader(
                  cityName: ref.watch(cityLocalizedNameProvider),
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
      body: SafeArea(
        child: RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          onRefresh: () async => ref.invalidate(favoritesProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              _FavoritesHeader(
                cityName: ref.watch(cityLocalizedNameProvider),
                onCityTap: () => showCityPickerSheet(context, ref),
              ),
              const SizedBox(height: 28),
              Text(
                l10n.favoritesTitle,
                style: const TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Text(
                    l10n.favoritesSortLabel,
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<FavoriteSortMode>(
                      value: _sort,
                      items: [
                        DropdownMenuItem(
                          value: FavoriteSortMode.recent,
                          child: Text(l10n.favoritesRecent),
                        ),
                        DropdownMenuItem(
                          value: FavoriteSortMode.name,
                          child: Text(l10n.favoritesByName),
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
                  message: context.l10n.favoritesLoadFailed,
                  onRetry: () => ref.invalidate(favoritesProvider),
                ),
                data: (allItems) {
                  if (allItems.isEmpty) {
                    return const _EmptyFavoritesAll();
                  }

                  final cityItems = filterFavoritesByCity(allItems, city.slug);
                  if (cityItems.isEmpty) {
                    return _EmptyFavoritesInCity(cityName: ref.watch(cityLocalizedNameProvider));
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
                            TrackedBusinessCard(
                              business: business,
                              trafficSource: BusinessTrafficSource.favorites,
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
                                  tooltip: context.l10n.favoritesRemoveTooltip,
                                  onPressed: () =>
                                      _removeFavorite(business.id),
                                  icon: Icon(
                                    Icons.favorite,
                                    color: Theme.of(context).colorScheme.primary,
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
          child: Icon(
            Icons.favorite_border,
            color: Theme.of(context).colorScheme.primary,
            size: 42,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          context.l10n.favoritesGuestTitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppTheme.textDark,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          context.l10n.favoritesGuestBody,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.textMuted, height: 1.35),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => context.push(
            '/login?redirect=${Uri.encodeComponent('/favorites')}',
          ),
          child: Text(context.l10n.commonLogin),
        ),
      ],
    );
  }
}

class _EmptyFavoritesAll extends StatelessWidget {
  const _EmptyFavoritesAll();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 56),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
            child: Icon(
              Icons.favorite_border,
              color: Theme.of(context).colorScheme.primary,
              size: 42,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.favoritesEmptyUser,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.textDark,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.favoritesEmptyUserHint,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.35),
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
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 56),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
            child: Icon(
              Icons.location_city_outlined,
              color: Theme.of(context).colorScheme.primary,
              size: 42,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.favoritesEmptyInCity(cityName),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.textDark,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.favoritesOtherCitiesHint,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.35),
          ),
        ],
      ),
    );
  }
}
