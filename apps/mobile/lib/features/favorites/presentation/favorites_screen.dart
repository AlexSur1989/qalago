import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/qalago_colors.dart';
import '../../../core/theme/qalago_radius.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_components.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../auth/providers/auth_provider.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  FavoriteSortMode _sort = FavoriteSortMode.recent;

  Future<void> _removeFavorite(BusinessModel business) async {
    final l10n = context.l10n;
    try {
      await ref.read(favoritesRepositoryProvider).remove(business.id);
      unawaited(
        ref.read(catalogRepositoryProvider).trackFavoriteRemove(business.id),
      );
      ref.invalidate(favoritesProvider);
      ref.invalidate(businessFavoriteProvider(business.id));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.favoritesRemoveFailed)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final favoritesAsync = ref.watch(favoritesProvider);
    final city = ref.watch(cityProvider);
    final isAuthed = ref.watch(authProvider).isAuthenticated;

    if (!isAuthed) {
      return Scaffold(
        backgroundColor: QalaGoColors.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              QalaGoSpacing.space20,
              QalaGoSpacing.space16,
              QalaGoSpacing.space20,
              QalaGoSpacing.space28,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _FavoritesHeader(
                  cityName: ref.watch(cityLocalizedNameProvider),
                  onCityTap: () => showCityPickerSheet(context, ref),
                ),
                const SizedBox(height: QalaGoSpacing.space24),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: _GuestFavoritesPrompt(
                      onLogin: () => context.push(
                        '/login?redirect=${Uri.encodeComponent('/favorites')}',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: QalaGoColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: QalaGoColors.primary,
          onRefresh: () async => ref.invalidate(favoritesProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              QalaGoSpacing.space20,
              QalaGoSpacing.space16,
              QalaGoSpacing.space20,
              QalaGoSpacing.space28,
            ),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              _FavoritesHeader(
                cityName: ref.watch(cityLocalizedNameProvider),
                onCityTap: () => showCityPickerSheet(context, ref),
              ),
              const SizedBox(height: QalaGoSpacing.space24),
              QalaGoPageTitle(text: l10n.favoritesTitle),
              const SizedBox(height: QalaGoSpacing.space16),
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: QalaGoSpacing.space8,
                runSpacing: QalaGoSpacing.space8,
                children: [
                  Text(
                    l10n.favoritesSortLabel,
                    style: const TextStyle(
                      color: QalaGoColors.textSecondary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Semantics(
                    label: l10n.favoritesSortLabel,
                    child: DropdownButtonHideUnderline(
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
                  ),
                ],
              ),
              const SizedBox(height: QalaGoSpacing.space16),
              favoritesAsync.when(
                loading: () => const LoadingView(),
                error: (_, __) => ErrorView(
                  message: l10n.favoritesLoadFailed,
                  onRetry: () => ref.invalidate(favoritesProvider),
                ),
                data: (allItems) {
                  if (allItems.isEmpty) {
                    return _EmptyFavoritesAll(
                      onBrowseCategories: () => context.go('/categories'),
                    );
                  }

                  final cityItems =
                      filterFavoritesByCity(allItems, city.slug);
                  if (cityItems.isEmpty) {
                    return _EmptyFavoritesInCity(
                      cityName: ref.watch(cityLocalizedNameProvider),
                      onBrowseCategories: () => context.go('/categories'),
                    );
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
                          clipBehavior: Clip.none,
                          children: [
                            TrackedBusinessCard(
                              business: business,
                              trafficSource: BusinessTrafficSource.favorites,
                              onTap: () => openBusiness(
                                context,
                                business.id,
                                BusinessTrafficSource.favorites,
                              ),
                            ),
                            Positioned(
                              top: QalaGoSpacing.space4,
                              right: QalaGoSpacing.space4,
                              child: Semantics(
                                button: true,
                                label: l10n.favoritesRemoveAccessibility(
                                  business.title,
                                ),
                                child: Material(
                                  color: QalaGoColors.surface
                                      .withValues(alpha: 0.92),
                                  shape: const CircleBorder(),
                                  elevation: 1,
                                  child: IconButton(
                                    tooltip: l10n.favoritesRemoveTooltip,
                                    constraints: const BoxConstraints(
                                      minWidth: QalaGoTouchTargets.minInteractive,
                                      minHeight: QalaGoTouchTargets.minInteractive,
                                    ),
                                    onPressed: () =>
                                        _removeFavorite(business),
                                    icon: Icon(
                                      Icons.favorite,
                                      color: QalaGoColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: QalaGoSpacing.space12),
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
    final l10n = context.l10n;
    final compactHeader = MediaQuery.sizeOf(context).width < 360;
    return Row(
      children: [
        Flexible(
          fit: FlexFit.loose,
          child: const QalaGoConsumerHeaderLogo(),
        ),
        const SizedBox(width: QalaGoSpacing.space8),
        Flexible(
          fit: FlexFit.loose,
          child: CityPill(cityName: cityName, onTap: onCityTap),
        ),
        IconButton(
          constraints: const BoxConstraints(
            minWidth: QalaGoTouchTargets.minInteractive,
            minHeight: QalaGoTouchTargets.minInteractive,
          ),
          tooltip: l10n.homeNotificationsTooltip,
          onPressed: () => context.push('/notifications'),
          icon: Icon(
            Icons.notifications_none_rounded,
            size: compactHeader ? 24 : 28,
          ),
        ),
      ],
    );
  }
}

class _GuestFavoritesPrompt extends StatelessWidget {
  const _GuestFavoritesPrompt({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: 42,
          backgroundColor: QalaGoColors.primary.withValues(alpha: 0.12),
          child: Icon(
            Icons.favorite_border,
            color: QalaGoColors.primary,
            size: 42,
          ),
        ),
        const SizedBox(height: QalaGoSpacing.space16),
        Text(
          l10n.favoritesGuestTitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: QalaGoColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: QalaGoSpacing.space8),
        Text(
          l10n.favoritesGuestBody,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: QalaGoColors.textSecondary,
            height: 1.35,
          ),
        ),
        const SizedBox(height: QalaGoSpacing.space24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: onLogin,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(QalaGoRadius.card),
              ),
            ),
            child: Text(
              l10n.commonLogin,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyFavoritesAll extends StatelessWidget {
  const _EmptyFavoritesAll({required this.onBrowseCategories});

  final VoidCallback onBrowseCategories;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: QalaGoColors.primary.withValues(alpha: 0.12),
            child: Icon(
              Icons.favorite_border,
              color: QalaGoColors.primary,
              size: 42,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space16),
          Text(
            l10n.favoritesEmptyUser,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: QalaGoColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space8),
          Text(
            l10n.favoritesEmptyUserHint,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: QalaGoColors.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space24),
          FilledButton(
            onPressed: onBrowseCategories,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(QalaGoRadius.card),
              ),
            ),
            child: Text(l10n.favoritesBrowseCategories),
          ),
        ],
      ),
    );
  }
}

class _EmptyFavoritesInCity extends StatelessWidget {
  const _EmptyFavoritesInCity({
    required this.cityName,
    required this.onBrowseCategories,
  });

  final String cityName;
  final VoidCallback onBrowseCategories;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: QalaGoColors.primary.withValues(alpha: 0.12),
            child: Icon(
              Icons.location_city_outlined,
              color: QalaGoColors.primary,
              size: 42,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space16),
          Text(
            l10n.favoritesEmptyInCity(cityName),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: QalaGoColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space8),
          Text(
            l10n.favoritesOtherCitiesHint,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: QalaGoColors.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: QalaGoSpacing.space24),
          FilledButton(
            onPressed: onBrowseCategories,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(QalaGoRadius.card),
              ),
            ),
            child: Text(l10n.favoritesBrowseCategories),
          ),
        ],
      ),
    );
  }
}
