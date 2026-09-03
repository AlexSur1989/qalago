import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
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
  String _sort = 'Недавние';

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final favoritesAsync = ref.watch(favoritesProvider);
    final city = ref.watch(cityProvider);

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
              _FavoritesHeader(cityName: city.nameRu),
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
                    child: DropdownButton<String>(
                      value: _sort,
                      items: const [
                        DropdownMenuItem(
                          value: 'Недавние',
                          child: Text('Недавние'),
                        ),
                        DropdownMenuItem(
                          value: 'Название',
                          child: Text('Название'),
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
                error: (e, _) => ErrorView(
                  message: '$e',
                  onRetry: () => ref.invalidate(favoritesProvider),
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return const _EmptyFavorites();
                  }

                  final businesses = items
                      .map((item) => item['business'] as Map<String, dynamic>?)
                      .whereType<Map<String, dynamic>>()
                      .map(BusinessModel.fromJson)
                      .toList();

                  if (_sort == 'Название') {
                    businesses.sort((a, b) => a.title.compareTo(b.title));
                  }

                  return Column(
                    children: [
                      for (final business in businesses) ...[
                        _FavoriteBusinessCard(
                          business: business,
                          onTap: () => context.push('/business/${business.id}'),
                          onRemove: () async {
                            await ref
                                .read(favoritesRepositoryProvider)
                                .remove(business.id);
                            ref.invalidate(favoritesProvider);
                          },
                          onWhatsapp: business.whatsapp == null
                              ? null
                              : () => unawaited(
                                  _launch(
                                    'https://wa.me/${business.whatsapp!.replaceAll('+', '')}',
                                  ),
                                ),
                          onRoute:
                              business.latitude == null ||
                                  business.longitude == null
                              ? null
                              : () => unawaited(
                                  _launch(
                                    'https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}',
                                  ),
                                ),
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
  const _FavoritesHeader({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: const QalaGoLogo(fontSize: 36),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
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
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Color(0xFF808796),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
        ),
      ],
    );
  }
}

class _FavoriteBusinessCard extends StatelessWidget {
  const _FavoriteBusinessCard({
    required this.business,
    required this.onTap,
    required this.onRemove,
    required this.onWhatsapp,
    required this.onRoute,
  });

  final BusinessModel business;
  final VoidCallback onTap;
  final VoidCallback onRemove;
  final VoidCallback? onWhatsapp;
  final VoidCallback? onRoute;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 150,
                height: 150,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: coverUrl.isNotEmpty
                            ? Image.network(
                                coverUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) =>
                                    _favoritePlaceholder(),
                              )
                            : _favoritePlaceholder(),
                      ),
                    ),
                    Positioned(
                      left: 12,
                      bottom: 12,
                      child: CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.black.withValues(alpha: 0.78),
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: Text(
                            _shortLogo(business.title),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              height: 1,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: SizedBox(
                  height: 150,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              business.title,
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            tooltip: 'Убрать из избранного',
                            onPressed: onRemove,
                            icon: const Icon(
                              Icons.favorite,
                              color: AppTheme.kzBlue,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        business.categoryTitle ?? 'Заведение',
                        style: const TextStyle(
                          color: Color(0xFF7B8291),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        business.shortDesc ?? business.address,
                        style: const TextStyle(
                          color: Color(0xFF596171),
                          fontSize: 13,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: onWhatsapp,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF20B15A),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 9,
                                ),
                                side: BorderSide(
                                  color: Colors.black.withValues(alpha: 0.08),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.chat, size: 18),
                              label: const FittedBox(child: Text('WhatsApp')),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: onRoute,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.kzBlue,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 9,
                                ),
                                side: BorderSide(
                                  color: AppTheme.kzBlue.withValues(alpha: 0.5),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.near_me, size: 18),
                              label: const FittedBox(child: Text('Маршрут')),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyFavorites extends StatelessWidget {
  const _EmptyFavorites();

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
            'Пока пусто',
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

Widget _favoritePlaceholder() {
  return Container(
    color: const Color(0xFFF0F2F5),
    child: const Center(
      child: Icon(Icons.storefront, color: Color(0xFF8A919F)),
    ),
  );
}

String _shortLogo(String title) {
  final parts = title
      .split(RegExp(r'\s+'))
      .where((part) => part.trim().isNotEmpty)
      .take(2)
      .map((part) => part.characters.first.toUpperCase())
      .join();
  return parts.isEmpty ? 'QG' : parts;
}
