import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../owner/presentation/widgets/service_menu_widgets.dart';

class BusinessDetailsScreen extends ConsumerStatefulWidget {
  const BusinessDetailsScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<BusinessDetailsScreen> createState() =>
      _BusinessDetailsScreenState();
}

class _BusinessDetailsScreenState extends ConsumerState<BusinessDetailsScreen> {
  final _reviewController = TextEditingController();
  int _rating = 5;
  bool _viewTracked = false;

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _launch(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.parse(url.startsWith('http') ? url : 'tel:$url');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  void _trackViewOnce() {
    if (_viewTracked) return;
    _viewTracked = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(
        ref.read(catalogRepositoryProvider).trackBusinessView(widget.id),
      );
    });
  }

  Future<void> _toggleFavorite() async {
    final repo = ref.read(favoritesRepositoryProvider);
    final analytics = ref.read(catalogRepositoryProvider);
    final fav = await repo.isFavorite(widget.id);

    if (fav) {
      await repo.remove(widget.id);
      unawaited(analytics.trackFavoriteRemove(widget.id));
    } else {
      await repo.add(widget.id);
      unawaited(analytics.trackFavoriteAdd(widget.id));
    }
    ref.invalidate(favoritesProvider);
  }

  Future<void> _submitReview() async {
    await ref
        .read(catalogRepositoryProvider)
        .createReview(
          businessId: widget.id,
          rating: _rating,
          text: _reviewController.text,
        );
    ref.invalidate(reviewsProvider(widget.id));
    ref.invalidate(myReviewsProvider);
    _reviewController.clear();
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Отзыв отправлен')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailsAsync = ref.watch(businessDetailsProvider(widget.id));
    final menuAsync = ref.watch(serviceMenuProvider(widget.id));
    final reviewsAsync = ref.watch(reviewsProvider(widget.id));
    final user = ref.watch(authProvider).user;
    final isOwner =
        user?.role == 'BUSINESS' ||
        user?.role == 'ADMIN' ||
        user?.role == 'CITY_ADMIN';

    return Scaffold(
      backgroundColor: Colors.white,
      body: detailsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () {
            ref.invalidate(businessDetailsProvider(widget.id));
            ref.invalidate(serviceMenuProvider(widget.id));
          },
        ),
        data: (data) {
          final category = _asMap(data['category']);
          final city = _asMap(data['city']);
          final title = data['title'] as String? ?? '';
          final categoryTitle = category?['title'] as String? ?? '';
          final cityName = city?['nameRu'] as String? ?? 'Уральск';
          final address = data['address'] as String? ?? '';
          final desc =
              data['description'] as String? ??
              data['shortDesc'] as String? ??
              '';
          final phone = data['phone'] as String?;
          final whatsapp = data['whatsapp'] as String?;
          final instagram = data['instagram'] as String?;
          final website = data['website'] as String?;
          final latitude = data['latitude']?.toString();
          final longitude = data['longitude']?.toString();
          final routeUrl = latitude != null && longitude != null
              ? 'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude'
              : null;
          final promotions = (data['promotions'] as List<dynamic>?) ?? [];
          final embeddedMenu = _asMap(data['menu']);
          final coverUrl = AppConstants.resolveMediaUrl(
            data['coverImageUrl'] as String?,
          );
          final galleryUrls = _galleryUrls(data['images'], coverUrl);
          final photoUrls = [if (coverUrl.isNotEmpty) coverUrl, ...galleryUrls];

          _trackViewOnce();

          return ListView(
            padding: EdgeInsets.zero,
            physics: const BouncingScrollPhysics(),
            children: [
              _HeroPhoto(
                imageUrl: coverUrl,
                cityName: cityName,
                onBack: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/home');
                  }
                },
                onFavorite: () => unawaited(_toggleFavorite()),
              ),
              Transform.translate(
                offset: const Offset(0, -28),
                child: _DetailsPanel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _TitleBlock(
                        title: title,
                        categoryTitle: categoryTitle,
                        address: address,
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          if (phone != null)
                            Expanded(
                              child: _PrimaryAction(
                                icon: Icons.phone_rounded,
                                label: 'Позвонить',
                                onTap: () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackCallClick(widget.id),
                                  );
                                  unawaited(_launch(phone));
                                },
                              ),
                            ),
                          if (phone != null && whatsapp != null)
                            const SizedBox(width: 10),
                          if (whatsapp != null)
                            Expanded(
                              child: _PrimaryAction(
                                icon: Icons.chat_bubble_outline_rounded,
                                label: 'WhatsApp',
                                onTap: () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackWhatsappClick(widget.id),
                                  );
                                  unawaited(
                                    _launch(
                                      'https://wa.me/${whatsapp.replaceAll('+', '')}',
                                    ),
                                  );
                                },
                              ),
                            ),
                          if ((phone != null || whatsapp != null) &&
                              routeUrl != null)
                            const SizedBox(width: 10),
                          if (routeUrl != null)
                            Expanded(
                              child: _PrimaryAction(
                                icon: Icons.assistant_direction_rounded,
                                label: 'Маршрут',
                                onTap: () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackRouteClick(widget.id),
                                  );
                                  unawaited(_launch(routeUrl));
                                },
                              ),
                            ),
                        ],
                      ),
                      if (website != null || instagram != null) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            if (website != null)
                              _MiniLinkButton(
                                icon: Icons.language_rounded,
                                label: 'Сайт',
                                onTap: () => unawaited(_launch(website)),
                              ),
                            if (instagram != null)
                              _MiniLinkButton(
                                icon: Icons.camera_alt_outlined,
                                label: 'Instagram',
                                onTap: () => unawaited(_launch(instagram)),
                              ),
                            _MiniLinkButton(
                              icon: Icons.favorite_border_rounded,
                              label: 'В избранное',
                              onTap: () => unawaited(_toggleFavorite()),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 26),
                      const _SectionTitle(title: 'О заведении'),
                      const SizedBox(height: 8),
                      Text(
                        desc.isEmpty ? 'Описание скоро появится.' : desc,
                        style: const TextStyle(
                          color: Color(0xFF596170),
                          fontSize: 15,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const _SectionTitle(title: 'Меню и услуги'),
                          if (isOwner)
                            TextButton(
                              onPressed: () => context.push(
                                '/owner/menu/${widget.id}?title=${Uri.encodeComponent(title)}',
                              ),
                              child: const Text('Редактировать'),
                            ),
                        ],
                      ),
                      menuAsync.when(
                        loading: () {
                          if (embeddedMenu == null) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 10),
                              child: LinearProgressIndicator(),
                            );
                          }
                          return PublicMenuView(menu: embeddedMenu);
                        },
                        error: (e, _) {
                          if (embeddedMenu != null) {
                            return PublicMenuView(menu: embeddedMenu);
                          }
                          return Text(
                            'Не удалось загрузить меню: $e',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          );
                        },
                        data: (menu) => PublicMenuView(menu: menu),
                      ),
                      if (promotions.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        const _SectionTitle(title: 'Акции'),
                        const SizedBox(height: 10),
                        ...promotions.map((raw) {
                          final promo = _asMap(raw) ?? {};
                          return _PromotionTile(promo: promo);
                        }),
                      ],
                      const SizedBox(height: 24),
                      _WorkHoursBlock(hours: data['workHours']),
                      if (photoUrls.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        const _SectionTitle(title: 'Фотографии'),
                        const SizedBox(height: 10),
                        _PhotosStrip(urls: photoUrls),
                      ],
                      const SizedBox(height: 24),
                      const _SectionTitle(title: 'Отзывы'),
                      const SizedBox(height: 8),
                      _ReviewsBlock(reviewsAsync: reviewsAsync),
                      if (!isOwner) ...[
                        const SizedBox(height: 16),
                        _ReviewForm(
                          controller: _reviewController,
                          rating: _rating,
                          onRatingChanged: (value) =>
                              setState(() => _rating = value ?? 5),
                          onSubmit: _submitReview,
                        ),
                      ],
                      const SizedBox(height: 26),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

List<String> _galleryUrls(dynamic images, String coverUrl) {
  final rawImages = (images as List<dynamic>?) ?? [];
  return rawImages
      .map((raw) {
        final image = _asMap(raw);
        if (image == null) return '';
        return AppConstants.resolveMediaUrl(image['imageUrl'] as String?);
      })
      .where((url) => url.isNotEmpty && url != coverUrl)
      .toList();
}

String _formatHours(dynamic raw) {
  final hours = _asMap(raw);
  final value = hours?['mon'] ?? hours?['monday'];
  if (value == null) return 'Уточняйте';
  if (value is String) return value.replaceAll('-', ' – ');
  final map = _asMap(value);
  if (map == null) return value.toString();
  if (map['closed'] == true) return 'Выходной';
  final open = map['open']?.toString();
  final close = map['close']?.toString();
  if (open == null || close == null) return 'Уточняйте';
  return '$open – $close';
}

class _HeroPhoto extends StatelessWidget {
  const _HeroPhoto({
    required this.imageUrl,
    required this.cityName,
    required this.onBack,
    required this.onFavorite,
  });

  final String imageUrl;
  final String cityName;
  final VoidCallback onBack;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 310,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl.isNotEmpty)
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _HeroPlaceholder(),
            )
          else
            _HeroPlaceholder(),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black54, Colors.transparent, Colors.black26],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _RoundIconButton(
                    icon: Icons.arrow_back_ios_new_rounded,
                    onTap: onBack,
                  ),
                  const Spacer(),
                  _CityPill(cityName: cityName),
                  const SizedBox(width: 10),
                  _RoundIconButton(
                    icon: Icons.favorite_border_rounded,
                    onTap: onFavorite,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFEAF8FC),
      child: const Center(
        child: Icon(Icons.storefront_rounded, size: 64, color: AppTheme.kzBlue),
      ),
    );
  }
}

class _DetailsPanel extends StatelessWidget {
  const _DetailsPanel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: child,
    );
  }
}

class _TitleBlock extends StatelessWidget {
  const _TitleBlock({
    required this.title,
    required this.categoryTitle,
    required this.address,
  });

  final String title;
  final String categoryTitle;
  final String address;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                  height: 1.08,
                ),
              ),
            ),
            const SizedBox(width: 12),
            const _RatingPill(),
          ],
        ),
        if (categoryTitle.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            categoryTitle,
            style: const TextStyle(
              color: Color(0xFF7A8190),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        if (address.isNotEmpty) ...[
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(
                Icons.location_on_outlined,
                color: Color(0xFF808896),
                size: 22,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  address,
                  style: const TextStyle(
                    color: Color(0xFF6F7684),
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _RatingPill extends StatelessWidget {
  const _RatingPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFE9F8FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star_rounded, color: AppTheme.kzGold, size: 20),
          SizedBox(width: 4),
          Text(
            '4.8',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
        ],
      ),
    );
  }
}

class _PrimaryAction extends StatelessWidget {
  const _PrimaryAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE4E8EE)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: SizedBox(
          height: 78,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppTheme.kzBlue, size: 26),
              const SizedBox(height: 6),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  label,
                  maxLines: 1,
                  style: const TextStyle(
                    color: AppTheme.kzBlue,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
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

class _MiniLinkButton extends StatelessWidget {
  const _MiniLinkButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppTheme.kzBlue,
        side: const BorderSide(color: Color(0xFFD6ECF3)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 21,
        fontWeight: FontWeight.w800,
        color: Colors.black,
      ),
    );
  }
}

class _PromotionTile extends StatelessWidget {
  const _PromotionTile({required this.promo});

  final Map<String, dynamic> promo;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.resolveMediaUrl(promo['imageUrl'] as String?);
    final title = promo['title'] as String? ?? '';
    final desc = promo['description'] as String? ?? '';
    final discount = promo['discountText'] as String? ?? 'Акция';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8EBF0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(18),
                ),
                child: imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        width: 118,
                        height: 92,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _OfferPlaceholder(),
                      )
                    : _OfferPlaceholder(),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.kzBlue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    discount,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (desc.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      desc,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF687080),
                        fontSize: 13,
                        height: 1.25,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: Icon(Icons.chevron_right_rounded, color: AppTheme.kzBlue),
          ),
        ],
      ),
    );
  }
}

class _OfferPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 118,
      height: 92,
      color: const Color(0xFFEAF8FC),
      child: const Icon(Icons.local_offer_rounded, color: AppTheme.kzBlue),
    );
  }
}

class _WorkHoursBlock extends StatelessWidget {
  const _WorkHoursBlock({required this.hours});

  final dynamic hours;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'График работы'),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7FAFC),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE8EBF0)),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.schedule_rounded,
                color: Color(0xFF808896),
                size: 22,
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Ежедневно',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                _formatHours(hours),
                style: const TextStyle(
                  color: Color(0xFF596170),
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, color: Color(0xFF8A92A0)),
            ],
          ),
        ),
      ],
    );
  }
}

class _PhotosStrip extends StatelessWidget {
  const _PhotosStrip({required this.urls});

  final List<String> urls;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 94,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: urls.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) => ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.network(
            urls[index],
            width: 128,
            height: 94,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              width: 128,
              height: 94,
              color: const Color(0xFFEAF8FC),
              child: const Icon(Icons.image_outlined, color: AppTheme.kzBlue),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReviewsBlock extends StatelessWidget {
  const _ReviewsBlock({required this.reviewsAsync});

  final AsyncValue<List<dynamic>> reviewsAsync;

  @override
  Widget build(BuildContext context) {
    return reviewsAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => Text('Ошибка отзывов: $e'),
      data: (reviews) {
        if (reviews.isEmpty) {
          return const Text(
            'Пока нет отзывов',
            style: TextStyle(color: Color(0xFF687080)),
          );
        }
        return Column(
          children: reviews
              .map(
                (r) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE8EBF0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              r.userName ?? 'Пользователь',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.star_rounded,
                            color: AppTheme.kzGold,
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${r.rating}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      if (r.text != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          r.text!,
                          style: const TextStyle(
                            color: Color(0xFF596170),
                            height: 1.35,
                          ),
                        ),
                      ],
                      if (r.ownerReply != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Ответ: ${r.ownerReply}',
                          style: const TextStyle(
                            color: Color(0xFF596170),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _ReviewForm extends StatelessWidget {
  const _ReviewForm({
    required this.controller,
    required this.rating,
    required this.onRatingChanged,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final int rating;
  final ValueChanged<int?> onRatingChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8EBF0)),
      ),
      child: Column(
        children: [
          DropdownButtonFormField<int>(
            initialValue: rating,
            decoration: const InputDecoration(labelText: 'Оценка'),
            items: List.generate(
              5,
              (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
            ),
            onChanged: onRatingChanged,
          ),
          const SizedBox(height: 10),
          TextField(
            controller: controller,
            decoration: const InputDecoration(labelText: 'Ваш отзыв'),
            maxLines: 3,
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onSubmit,
              child: const Text('Оставить отзыв'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 52,
          height: 52,
          child: Icon(icon, color: Colors.black, size: 24),
        ),
      ),
    );
  }
}

class _CityPill extends StatelessWidget {
  const _CityPill({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
          const SizedBox(width: 5),
          Text(
            cityName,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
        ],
      ),
    );
  }
}
