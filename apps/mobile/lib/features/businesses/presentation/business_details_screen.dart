import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/location/passive_user_position.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/utils/audience_distance_bucket.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/json_parse.dart';
import '../../../shared/utils/business_detail_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../core/auth/auth_prompt.dart';
import '../../ads/utils/ad_url_utils.dart';
import '../../analytics/providers/analytics_identity_provider.dart';
import '../../analytics/widgets/reviews_view_tracker.dart';
import '../../analytics/widgets/tracked_catalog_item_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../business_onboarding/presentation/business_claim_cta.dart';
import '../../recommendations/data/ai_repository.dart';

class BusinessDetailsScreen extends ConsumerStatefulWidget {
  const BusinessDetailsScreen({
    super.key,
    required this.id,
    this.trafficSource,
    this.searchQuery,
  });

  final String id;
  final BusinessTrafficSource? trafficSource;
  final String? searchQuery;

  @override
  ConsumerState<BusinessDetailsScreen> createState() =>
      _BusinessDetailsScreenState();
}

class _BusinessDetailsScreenState extends ConsumerState<BusinessDetailsScreen> {
  int _rating = 5;
  bool _viewTracked = false;

  @override
  void initState() {
    super.initState();
  }

  Future<void> _trackViewOnce({
    required double? latitude,
    required double? longitude,
  }) async {
    if (_viewTracked || !mounted) return;
    _viewTracked = true;

    final cachedPosition = ref.read(userLocationProvider).valueOrNull;
    final userPosition = await readPassiveUserPosition(
      activeStreamValue: cachedPosition,
    );
    final bucket = computeAudienceDistanceBucket(
      businessLat: latitude,
      businessLng: longitude,
      userPosition: userPosition,
    );

    if (!mounted) return;
    final source = widget.trafficSource ?? BusinessTrafficSource.direct;
    final sessionId = ref.read(analyticsSessionIdProvider);
    final visitorId = await ref.read(analyticsVisitorIdProvider.future);
    if (!mounted) return;
    unawaited(
      ref.read(catalogRepositoryProvider).trackBusinessView(
            widget.id,
            trafficSource: source,
            searchQuery: source == BusinessTrafficSource.search
                ? widget.searchQuery
                : null,
            audienceDistanceBucket: bucket,
            discoverySurface: source.openDiscoverySurface,
            visitorId: visitorId,
            sessionId: sessionId,
          ),
    );
  }

  Future<void> _launchExternal(String? url) async {
    if (url == null) return;
    await launchSafeHttpUrl(url);
  }

  Future<void> _launchPhone(String? phone) async {
    final tel = normalizeTelUri(phone);
    if (tel == null) return;
    await launchPhone(tel);
  }

  Future<void> _launchWhatsApp(String? whatsapp) async {
    await launchWhatsApp(whatsapp);
  }

  Future<void> _launchRoute({
    required double? latitude,
    required double? longitude,
    required String? address,
  }) async {
    final url = buildRouteUrl(
      latitude: latitude,
      longitude: longitude,
      address: address,
    );
    if (url == null) return;
    await launchSafeHttpUrl(url);
  }

  Future<void> _toggleFavorite() async {
    if (!ref.read(authProvider).isAuthenticated) {
      if (!mounted) return;
      await showAuthRequiredDialog(
        context,
        title: 'Войдите в QalaGo',
        message: 'Чтобы сохранять избранное, войдите по номеру телефона.',
        returnPath: '/business/${widget.id}',
      );
      return;
    }

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
    ref.invalidate(businessFavoriteProvider(widget.id));
  }

  Future<void> _submitReview(String text) async {
    final analytics = ref.read(catalogRepositoryProvider);
    await analytics.createReview(
      businessId: widget.id,
      rating: _rating,
      text: text,
    );
    final sessionId = ref.read(analyticsSessionIdProvider);
    unawaited(
      ref.read(analyticsVisitorIdProvider.future).then(
            (visitorId) => analytics.trackReviewCreated(
              widget.id,
              visitorId: visitorId,
              sessionId: sessionId,
            ),
          ),
    );
    ref.invalidate(businessDetailsProvider(widget.id));
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Отзыв отправлен')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailsAsync = ref.watch(businessDetailsProvider(widget.id));
    final favoriteAsync = ref.watch(businessFavoriteProvider(widget.id));
    final isAuthenticated = ref.watch(authProvider).isAuthenticated;
    final canManageMenu = isAuthenticated &&
        ref.watch(myBusinessesProvider).maybeWhen(
              data: (businesses) =>
                  businesses.any((b) => b['id'] == widget.id),
              orElse: () => false,
            );

    return Scaffold(
      body: detailsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: _consumerErrorMessage('$e'),
          onRetry: () {
            ref.invalidate(businessDetailsProvider(widget.id));
          },
        ),
        data: (data) {
          final category = _asMap(data['category']);
          final city = _asMap(data['city']);
          final title = data['title'] as String? ?? '';
          final categoryTitle = category?['title'] as String? ?? '';
          final cityName = city?['nameRu'] as String? ?? 'Уральск';
          final cityTimezone =
              city?['timezone'] as String? ?? kDefaultBusinessTimezone;
          final address = data['address'] as String? ?? '';
          final desc = sanitizeDescription(
            data['description'] as String? ?? data['shortDesc'] as String?,
          );
          final phone = data['phone'] as String?;
          final whatsapp = data['whatsapp'] as String?;
          final instagramUrl = normalizeInstagramUrl(data['instagram'] as String?);
          final websiteUrl = normalizeWebsiteUrl(data['website'] as String?);
          final latitude = parseJsonDouble(data['latitude']);
          final longitude = parseJsonDouble(data['longitude']);
          if (!_viewTracked) {
            unawaited(_trackViewOnce(latitude: latitude, longitude: longitude));
          }
          final routeAvailable = buildRouteUrl(
                latitude: latitude,
                longitude: longitude,
                address: address,
              ) !=
              null;
          final galleryPreview = previewBlock(data, 'galleryPreview');
          final catalogPreview = previewBlock(data, 'catalogPreview');
          final promotionsPreview = previewBlock(data, 'promotionsPreview');
          final reviewsPreview = previewBlock(data, 'reviewsPreview');

          final promotionItems =
              (promotionsPreview?['items'] as List<dynamic>? ??
                      data['promotions'] as List<dynamic>? ??
                      [])
                  .cast<Map<String, dynamic>>();
          final promotions = filterActivePromotions(promotionItems);
          final promotionTotal =
              promotionsPreview?['totalCount'] as int? ?? promotions.length;

          final catalogItems =
              (catalogPreview?['items'] as List<dynamic>? ?? [])
                  .cast<Map<String, dynamic>>();
          final catalogTotal =
              catalogPreview?['totalCount'] as int? ?? catalogItems.length;

          final galleryItems =
              (galleryPreview?['items'] as List<dynamic>? ??
                      data['images'] as List<dynamic>? ??
                      [])
                  .cast<Map<String, dynamic>>();
          final galleryTotal =
              galleryPreview?['totalCount'] as int? ?? galleryItems.length;

          final reviewItems =
              (reviewsPreview?['items'] as List<dynamic>? ?? [])
                  .cast<Map<String, dynamic>>();
          final reviewTotal =
              reviewsPreview?['totalCount'] as int? ?? reviewItems.length;

          final coverUrl = AppConstants.resolveMediaUrl(
            data['coverImageUrl'] as String?,
          );
          final galleryUrls = galleryItems
              .map((image) =>
                  AppConstants.resolveMediaUrl(image['imageUrl'] as String?))
              .where((url) => url.isNotEmpty)
              .toList();
          final photoUrls = [if (coverUrl.isNotEmpty) coverUrl, ...galleryUrls];
          final openStatus =
              computeOpenStatus(data['workHours'], timezone: cityTimezone);
          final openLabel = openStatusLabel(openStatus);
          final hasHours = hasWorkHours(data['workHours']);
          final weekRows = weeklyHoursRows(data['workHours']);

          final reviewStats = reviewStatsFromPreview(reviewItems, reviewTotal);

          return ListView(
            padding: EdgeInsets.zero,
            physics: const BouncingScrollPhysics(),
            children: [
              _HeroPhoto(
                imageUrl: coverUrl,
                cityName: cityName,
                isFavorite: favoriteAsync.value ?? false,
                onBack: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/home');
                  }
                },
                onFavorite: () => unawaited(_toggleFavorite()),
                onImageTap: photoUrls.isEmpty
                    ? null
                    : () => _openGallery(context, photoUrls, 0),
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
                        averageRating: reviewStats.$1,
                        reviewCount: reviewStats.$2,
                        openLabel: openLabel,
                        openStatus: openStatus,
                      ),
                      const SizedBox(height: 20),
                      _PrimaryActionsRow(
                        phone: phone,
                        whatsapp: whatsapp,
                        routeAvailable: routeAvailable,
                        onCall: () {
                          unawaited(
                            ref
                                .read(catalogRepositoryProvider)
                                .trackCallClick(widget.id),
                          );
                          unawaited(_launchPhone(phone));
                        },
                        onWhatsApp: () {
                          unawaited(
                            ref
                                .read(catalogRepositoryProvider)
                                .trackWhatsappClick(widget.id),
                          );
                          unawaited(_launchWhatsApp(whatsapp));
                        },
                        onRoute: () {
                          unawaited(
                            ref
                                .read(catalogRepositoryProvider)
                                .trackRouteClick(widget.id),
                          );
                          unawaited(
                            _launchRoute(
                              latitude: latitude,
                              longitude: longitude,
                              address: address,
                            ),
                          );
                        },
                      ),
                      if (websiteUrl != null || instagramUrl != null) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            if (websiteUrl != null)
                              _MiniLinkButton(
                                icon: Icons.language_rounded,
                                label: 'Сайт',
                                onTap: () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackWebsiteClick(widget.id),
                                  );
                                  unawaited(_launchExternal(websiteUrl));
                                },
                              ),
                            if (instagramUrl != null)
                              _MiniLinkButton(
                                icon: Icons.camera_alt_outlined,
                                label: 'Instagram',
                                onTap: () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackInstagramClick(widget.id),
                                  );
                                  unawaited(_launchExternal(instagramUrl));
                                },
                              ),
                          ],
                        ),
                      ],
                      if (desc.isNotEmpty) ...[
                        const SizedBox(height: 26),
                        const _SectionTitle(title: 'О заведении'),
                        const SizedBox(height: 8),
                        Text(
                          desc,
                          style: const TextStyle(
                            color: Color(0xFF596170),
                            fontSize: 15,
                            height: 1.45,
                          ),
                        ),
                      ],
                      if (promotions.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        _SectionHeaderRow(
                          title: 'Акции',
                          actionLabel: promotionTotal > promotions.length
                              ? 'Все акции ($promotionTotal)'
                              : null,
                          onAction: promotionTotal > promotions.length
                              ? () => context.push('/promotions')
                              : null,
                        ),
                        const SizedBox(height: 10),
                        ...promotions.map(
                          (promo) => _PromotionTile(
                            promo: promo,
                            onTap: () {
                              unawaited(
                                ref
                                    .read(catalogRepositoryProvider)
                                    .trackPromotionView(
                                      widget.id,
                                      promotionId: promo['id'] as String?,
                                    ),
                              );
                            },
                          ),
                        ),
                      ],
                      if (catalogItems.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        _SectionHeaderRow(
                          title: 'Товары и услуги',
                          actionLabel: catalogTotal > catalogItems.length
                              ? 'Смотреть все ($catalogTotal)'
                              : null,
                          onAction: catalogTotal > catalogItems.length
                              ? () => context.push('/business/${widget.id}/catalog')
                              : null,
                          trailing: canManageMenu
                              ? TextButton(
                                  onPressed: () => context.push(
                                    '/owner/menu/${widget.id}?title=${Uri.encodeComponent(title)}',
                                  ),
                                  child: const Text('Редактировать'),
                                )
                              : null,
                        ),
                        const SizedBox(height: 10),
                        for (final item in catalogItems)
                          TrackedCatalogItemCard(
                            businessId: widget.id,
                            item: item,
                            surface: 'BUSINESS_DETAIL_PREVIEW',
                            onTap: catalogTotal > catalogItems.length
                                ? () => context.push('/business/${widget.id}/catalog')
                                : null,
                          ),
                      ],
                      if (hasHours) ...[
                        const SizedBox(height: 24),
                        _WorkHoursBlock(
                          today: todayHoursLabel(
                            data['workHours'],
                            timezone: cityTimezone,
                          ),
                          weekRows: weekRows,
                        ),
                      ],
                      if (phone != null ||
                          whatsapp != null ||
                          websiteUrl != null ||
                          instagramUrl != null) ...[
                        const SizedBox(height: 24),
                        _ContactsSection(
                          phone: phone,
                          whatsapp: whatsapp,
                          websiteUrl: websiteUrl,
                          instagramUrl: instagramUrl,
                        ),
                      ],
                      if (!canManageMenu) ...[
                        const SizedBox(height: 24),
                        BusinessClaimCta(businessId: widget.id),
                      ],
                      if (latitude != null && longitude != null) ...[
                        const SizedBox(height: 24),
                        _MiniMapSection(
                          latitude: latitude,
                          longitude: longitude,
                          onRoute: routeAvailable
                              ? () {
                                  unawaited(
                                    ref
                                        .read(catalogRepositoryProvider)
                                        .trackRouteClick(widget.id),
                                  );
                                  unawaited(
                                    _launchRoute(
                                      latitude: latitude,
                                      longitude: longitude,
                                      address: address,
                                    ),
                                  );
                                }
                              : null,
                        ),
                      ],
                      if (photoUrls.length > 1 || galleryTotal > 1) ...[
                        const SizedBox(height: 24),
                        _SectionHeaderRow(
                          title: 'Фотографии',
                          actionLabel: galleryTotal > photoUrls.length
                              ? 'Все фото ($galleryTotal)'
                              : null,
                          onAction: galleryTotal > photoUrls.length
                              ? () => context.push('/business/${widget.id}/photos')
                              : null,
                        ),
                        const SizedBox(height: 10),
                        _PhotosStrip(
                          urls: photoUrls,
                          onTap: (index) =>
                              _openGallery(context, photoUrls, index),
                        ),
                      ],
                      const SizedBox(height: 24),
                      ReviewsViewTracker(
                        businessId: widget.id,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const _SectionHeaderRow(title: 'Отзывы'),
                            const SizedBox(height: 8),
                            _ReviewsPreviewBlock(reviews: reviewItems),
                          ],
                        ),
                      ),
                      if (!canManageMenu) ...[
                        const SizedBox(height: 16),
                        if (isAuthenticated)
                          _ReviewForm(
                            rating: _rating,
                            onRatingChanged: (value) =>
                                setState(() => _rating = value ?? 5),
                            onSubmit: _submitReview,
                          )
                        else
                          _LoginToReviewPrompt(
                            onLogin: () => showAuthRequiredDialog(
                              context,
                              title: 'Войдите в QalaGo',
                              message:
                                  'Чтобы оставить отзыв, войдите по номеру телефона.',
                              returnPath: '/business/${widget.id}',
                            ),
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

class _SectionHeaderRow extends StatelessWidget {
  const _SectionHeaderRow({
    required this.title,
    this.actionLabel,
    this.onAction,
    this.trailing,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(child: _SectionTitle(title: title)),
        if (trailing != null) trailing!,
        if (actionLabel != null && onAction != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class _ReviewsPreviewBlock extends StatelessWidget {
  const _ReviewsPreviewBlock({required this.reviews});

  final List<Map<String, dynamic>> reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return const Text(
        'Пока нет отзывов',
        style: TextStyle(color: Color(0xFF687080)),
      );
    }

    return Column(
      children: reviews.map((review) {
        final user = _asMap(review['user']);
        final name = user?['name'] as String? ?? 'Пользователь';
        final rating = (review['rating'] as num?)?.toInt() ?? 0;
        return Container(
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
                      name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  const Icon(Icons.star, color: Colors.amber, size: 16),
                  const SizedBox(width: 4),
                  Text('$rating'),
                ],
              ),
              if (review['text'] != null) ...[
                const SizedBox(height: 6),
                Text(review['text'] as String),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
}

String _consumerErrorMessage(String raw) {
  final lower = raw.toLowerCase();
  if (lower.contains('404') || lower.contains('not found')) {
    return 'Заведение не найдено или недоступно';
  }
  return 'Не удалось загрузить информацию о заведении';
}

void _openGallery(BuildContext context, List<String> urls, int initialIndex) {
  showDialog<void>(
    context: context,
    barrierColor: Colors.black87,
    builder: (ctx) => _GalleryViewer(urls: urls, initialIndex: initialIndex),
  );
}

class _HeroPhoto extends StatelessWidget {
  const _HeroPhoto({
    required this.imageUrl,
    required this.cityName,
    required this.isFavorite,
    required this.onBack,
    required this.onFavorite,
    this.onImageTap,
  });

  final String imageUrl;
  final String cityName;
  final bool isFavorite;
  final VoidCallback onBack;
  final VoidCallback onFavorite;
  final VoidCallback? onImageTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 310,
      child: Stack(
        fit: StackFit.expand,
        children: [
          GestureDetector(
            onTap: onImageTap,
            child: imageUrl.isNotEmpty
                ? Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => _HeroPlaceholder(),
                  )
                : _HeroPlaceholder(),
          ),
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
                    icon: isFavorite
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    iconColor: isFavorite ? AppTheme.kzGold : Colors.black,
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
    required this.averageRating,
    required this.reviewCount,
    required this.openLabel,
    required this.openStatus,
  });

  final String title;
  final String categoryTitle;
  final String address;
  final double? averageRating;
  final int reviewCount;
  final String openLabel;
  final BusinessOpenStatus openStatus;

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
            _RatingPill(
              averageRating: averageRating,
              reviewCount: reviewCount,
            ),
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
        if (openLabel.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: openStatus == BusinessOpenStatus.open
                  ? const Color(0xFFE8F8EE)
                  : const Color(0xFFFCEFEE),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              openLabel,
              style: TextStyle(
                color: openStatus == BusinessOpenStatus.open
                    ? const Color(0xFF1B7F4A)
                    : const Color(0xFFC0392B),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
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
  const _RatingPill({
    required this.averageRating,
    required this.reviewCount,
  });

  final double? averageRating;
  final int reviewCount;

  @override
  Widget build(BuildContext context) {
    final label = reviewCount == 0
        ? 'Нет отзывов'
        : averageRating!.toStringAsFixed(1);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFE9F8FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (reviewCount > 0) ...[
            const Icon(
              Icons.star_rounded,
              color: AppTheme.kzGold,
              size: 20,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: reviewCount == 0 ? 13 : 15,
              color: reviewCount == 0
                  ? const Color(0xFF7A8190)
                  : Colors.black,
            ),
          ),
          if (reviewCount > 0) ...[
            const SizedBox(width: 4),
            Text(
              '($reviewCount)',
              style: const TextStyle(
                color: Color(0xFF7A8190),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PrimaryActionsRow extends StatelessWidget {
  const _PrimaryActionsRow({
    required this.phone,
    required this.whatsapp,
    required this.routeAvailable,
    required this.onCall,
    required this.onWhatsApp,
    required this.onRoute,
  });

  final String? phone;
  final String? whatsapp;
  final bool routeAvailable;
  final VoidCallback? onCall;
  final VoidCallback? onWhatsApp;
  final VoidCallback? onRoute;

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    if (phone != null && normalizeTelUri(phone) != null) {
      children.add(
        Expanded(
          child: _PrimaryAction(
            icon: Icons.phone_rounded,
            label: 'Позвонить',
            onTap: onCall,
          ),
        ),
      );
    }
    if (whatsapp != null && normalizeWhatsAppUrl(whatsapp) != null) {
      if (children.isNotEmpty) children.add(const SizedBox(width: 10));
      children.add(
        Expanded(
          child: _PrimaryAction(
            icon: Icons.chat_bubble_outline_rounded,
            label: 'WhatsApp',
            onTap: onWhatsApp,
          ),
        ),
      );
    }
    if (routeAvailable) {
      if (children.isNotEmpty) children.add(const SizedBox(width: 10));
      children.add(
        Expanded(
          child: _PrimaryAction(
            icon: Icons.assistant_direction_rounded,
            label: 'Маршрут',
            onTap: onRoute,
          ),
        ),
      );
    }
    if (children.isEmpty) return const SizedBox.shrink();
    return Row(children: children);
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
  final VoidCallback? onTap;

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
  const _PromotionTile({required this.promo, this.onTap});

  final Map<String, dynamic> promo;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.resolveMediaUrl(promo['imageUrl'] as String?);
    final title = promo['title'] as String? ?? '';
    final desc = promo['description'] as String? ?? '';
    final discount = promo['discountText'] as String? ?? 'Акция';
    final endDateRaw = promo['endDate'];
    String? expiryLabel;
    if (endDateRaw != null) {
      final end = DateTime.tryParse(endDateRaw.toString());
      if (end != null) {
        expiryLabel =
            'до ${end.toLocal().day}.${end.toLocal().month}.${end.toLocal().year}';
      }
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
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
                  if (expiryLabel != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      expiryLabel,
                      style: const TextStyle(
                        color: Color(0xFF9AA1AD),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
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
  const _WorkHoursBlock({
    required this.today,
    required this.weekRows,
  });

  final (String, String) today;
  final List<(String, String)> weekRows;

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
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.schedule_rounded,
                    color: Color(0xFF808896),
                    size: 22,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      today.$1,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    today.$2,
                    style: const TextStyle(
                      color: Color(0xFF596170),
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              if (weekRows.isNotEmpty) ...[
                const Divider(height: 24),
                ...weekRows.map(
                  (row) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            row.$1,
                            style: TextStyle(
                              color: row.$1.contains('сегодня')
                                  ? AppTheme.kzBlue
                                  : const Color(0xFF7A8190),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            row.$2,
                            style: const TextStyle(
                              color: Color(0xFF596170),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _PhotosStrip extends StatelessWidget {
  const _PhotosStrip({required this.urls, required this.onTap});

  final List<String> urls;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 94,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: urls.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) => GestureDetector(
          onTap: () => onTap(index),
          child: ClipRRect(
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
      ),
    );
  }
}

class _ReviewForm extends ConsumerStatefulWidget {
  const _ReviewForm({
    required this.rating,
    required this.onRatingChanged,
    required this.onSubmit,
  });

  final int rating;
  final ValueChanged<int?> onRatingChanged;
  final Future<void> Function(String text) onSubmit;

  @override
  ConsumerState<_ReviewForm> createState() => _ReviewFormState();
}

class _ReviewFormState extends ConsumerState<_ReviewForm> {
  final _controller = TextEditingController();
  Timer? _debounce;
  ModerationAnalysisModel? _analysis;
  bool _checking = false;
  int _requestId = 0;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _queueModerationCheck() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), () {
      unawaited(_checkModeration());
    });
  }

  Future<void> _checkModeration() async {
    final text = _controller.text.trim();
    if (text.length < 3) {
      if (!mounted) return;
      setState(() {
        _analysis = null;
        _checking = false;
      });
      return;
    }

    final requestId = ++_requestId;
    setState(() => _checking = true);

    final analysis = await ref.read(aiRepositoryProvider).analyzeModeration(
          text: text,
          rating: widget.rating,
        );

    if (!mounted || requestId != _requestId) return;
    setState(() {
      _analysis = analysis;
      _checking = false;
    });
  }

  Future<void> _handleSubmit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Напишите текст отзыва')),
      );
      return;
    }

    if (_analysis?.suggestedAction == 'reject') {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Проверьте отзыв'),
          content: const Text(
            'Текст может нарушать правила площадки. '
            'Отредактируйте отзыв или отправьте как есть — '
            'модератор проверит вручную.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Редактировать'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Отправить'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    await widget.onSubmit(text);
    if (!mounted) return;
    _controller.clear();
    setState(() => _analysis = null);
  }

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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<int>(
            initialValue: widget.rating,
            decoration: const InputDecoration(labelText: 'Оценка'),
            items: List.generate(
              5,
              (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
            ),
            onChanged: (value) {
              widget.onRatingChanged(value);
              _queueModerationCheck();
            },
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(labelText: 'Ваш отзыв'),
            maxLines: 3,
            onChanged: (_) => _queueModerationCheck(),
          ),
          if (_checking) ...[
            const SizedBox(height: 10),
            const LinearProgressIndicator(minHeight: 2),
          ] else if (_analysis != null) ...[
            const SizedBox(height: 10),
            _ModerationHint(analysis: _analysis!),
          ],
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _handleSubmit,
              child: const Text('Оставить отзыв'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModerationHint extends StatelessWidget {
  const _ModerationHint({required this.analysis});

  final ModerationAnalysisModel analysis;

  @override
  Widget build(BuildContext context) {
    final (color, icon, title) = switch (analysis.suggestedAction) {
      'approve' => (
          const Color(0xFF1B7F4A),
          Icons.check_circle_outline,
          'Отзыв выглядит нормально',
        ),
      'reject' => (
          const Color(0xFFC0392B),
          Icons.warning_amber_rounded,
          'Возможные нарушения',
        ),
      _ => (
          const Color(0xFFB7791F),
          Icons.info_outline,
          'Рекомендуем проверить текст',
        ),
    };

    final detail = analysis.flags.isNotEmpty
        ? analysis.flags.first.message
        : 'Оценка качества: ${analysis.score}/100';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  detail,
                  style: const TextStyle(
                    color: Color(0xFF596170),
                    fontSize: 13,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginToReviewPrompt extends StatelessWidget {
  const _LoginToReviewPrompt({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8EBF0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Войдите, чтобы оставить отзыв',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 8),
          const Text(
            'Отзывы доступны авторизованным пользователям.',
            style: TextStyle(color: Color(0xFF596170), height: 1.35),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: onLogin, child: const Text('Войти')),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.onTap,
    this.iconColor = Colors.black,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color iconColor;

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
          child: Icon(icon, color: iconColor, size: 24),
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

class _ContactsSection extends StatelessWidget {
  const _ContactsSection({
    required this.phone,
    required this.whatsapp,
    required this.websiteUrl,
    required this.instagramUrl,
  });

  final String? phone;
  final String? whatsapp;
  final String? websiteUrl;
  final String? instagramUrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'Контакты'),
        const SizedBox(height: 10),
        if (phone != null && phone!.trim().isNotEmpty)
          _ContactRow(icon: Icons.phone_outlined, label: phone!),
        if (whatsapp != null && whatsapp!.trim().isNotEmpty)
          _ContactRow(icon: Icons.chat_bubble_outline, label: whatsapp!),
        if (websiteUrl != null)
          _ContactRow(icon: Icons.language_outlined, label: websiteUrl!),
        if (instagramUrl != null)
          _ContactRow(icon: Icons.camera_alt_outlined, label: instagramUrl!),
      ],
    );
  }
}

class _ContactRow extends StatelessWidget {
  const _ContactRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF808896)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF596170),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniMapSection extends StatelessWidget {
  const _MiniMapSection({
    required this.latitude,
    required this.longitude,
    required this.onRoute,
  });

  final double latitude;
  final double longitude;
  final VoidCallback? onRoute;

  @override
  Widget build(BuildContext context) {
    final point = LatLng(latitude, longitude);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'На карте'),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: SizedBox(
            height: 160,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: point,
                initialZoom: 15,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.none,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'kz.qalago.mobile',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: point,
                      width: 36,
                      height: 36,
                      child: const Icon(
                        Icons.location_on,
                        color: AppTheme.kzBlue,
                        size: 36,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (onRoute != null) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: onRoute,
            icon: const Icon(Icons.directions_rounded),
            label: const Text('Построить маршрут'),
          ),
        ],
      ],
    );
  }
}

class _GalleryViewer extends StatefulWidget {
  const _GalleryViewer({required this.urls, required this.initialIndex});

  final List<String> urls;
  final int initialIndex;

  @override
  State<_GalleryViewer> createState() => _GalleryViewerState();
}

class _GalleryViewerState extends State<_GalleryViewer> {
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.urls.length,
        itemBuilder: (context, index) => InteractiveViewer(
          child: Center(
            child: Image.network(
              widget.urls[index],
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const Icon(
                Icons.broken_image_outlined,
                color: Colors.white54,
                size: 64,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
