import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/map/qalago_map_camera.dart';
import '../../../core/map/qalago_map_coordinate.dart';
import '../../../core/map/qalago_map_marker.dart';
import '../../../core/map/qalago_map_view.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_colors.dart';
import '../../../core/theme/qalago_radius.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../core/location/passive_user_position.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/utils/audience_distance_bucket.dart';
import '../../../shared/utils/json_parse.dart';
import '../../../shared/utils/business_detail_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_components.dart';
import '../../../core/auth/auth_prompt.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/localized_content.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../l10n/app_localizations.dart';
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
      final l10n = context.l10n;
      await showAuthRequiredDialog(
        context,
        title: l10n.businessLoginTitle,
        message: l10n.businessLoginFavoriteMessage,
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
      ).showSnackBar(SnackBar(content: Text(context.l10n.businessReviewSent)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
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
          message: _consumerErrorMessage(l10n, '$e'),
          onRetry: () {
            ref.invalidate(businessDetailsProvider(widget.id));
          },
        ),
        data: (data) {
          final category = _asMap(data['category']);
          final city = _asMap(data['city']);
          final title = data['title'] as String? ?? '';
          final categoryTitle = category?['title'] as String? ?? '';
          final cityName = city != null
              ? cityDisplayName(
                  localeCode: ref.watch(appLocaleCodeProvider),
                  nameRu: city['nameRu'] as String? ?? l10n.profileAboutMvpCityValue,
                  nameKk: city['nameKk'] as String?,
                )
              : l10n.profileAboutMvpCityValue;
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
                onBack: () => qalagoPopBusinessDetail(
                  context,
                  widget.trafficSource ?? BusinessTrafficSource.direct,
                  searchQuery: widget.searchQuery,
                ),
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
                                label: l10n.businessWebsite,
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
                                label: l10n.businessInstagram,
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
                        _SectionTitle(title: l10n.businessAbout),
                        const SizedBox(height: 8),
                        Text(
                          desc,
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 15,
                            height: 1.45,
                          ),
                        ),
                      ],
                      if (promotions.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        _SectionHeaderRow(
                          title: l10n.businessPromotions,
                          actionLabel: promotionTotal > promotions.length
                              ? l10n.businessAllPromotions(promotionTotal)
                              : null,
                          onAction: promotionTotal > promotions.length
                              ? () => context.push('/promotions')
                              : null,
                        ),
                        const SizedBox(height: 10),
                        ...promotions.map(
                          (promo) => _PromotionTile(
                            localeCode: resolveLocaleCode(
                              ref.watch(appLocaleCodeProvider),
                            ),
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
                          title: l10n.businessProductsServices,
                          actionLabel: catalogTotal > catalogItems.length
                              ? l10n.businessViewAllCount(catalogTotal)
                              : null,
                          onAction: catalogTotal > catalogItems.length
                              ? () => context.push('/business/${widget.id}/catalog')
                              : null,
                          trailing: canManageMenu
                              ? TextButton(
                                  onPressed: () => context.push(
                                    '/owner/menu/${widget.id}?title=${Uri.encodeComponent(title)}',
                                  ),
                                  child: Text(l10n.businessEdit),
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
                          title: l10n.businessPhotos,
                          actionLabel: galleryTotal > photoUrls.length
                              ? l10n.businessAllPhotos(galleryTotal)
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
                            _SectionHeaderRow(title: l10n.businessReviews),
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
                              title: l10n.businessLoginTitle,
                              message: l10n.businessLoginReviewMessage,
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
    final l10n = context.l10n;
    if (reviews.isEmpty) {
      return Text(
        l10n.businessNoReviewsYet,
        style: const TextStyle(color: AppTheme.textMuted),
      );
    }

    return Column(
      children: reviews.map((review) {
        final user = _asMap(review['user']);
        final name = user?['name'] as String? ?? l10n.profileDefaultUser;
        final rating = (review['rating'] as num?)?.toInt() ?? 0;
        return Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceSubtle,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderSubtle),
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

String _consumerErrorMessage(AppLocalizations l10n, String raw) {
  final lower = raw.toLowerCase();
  if (lower.contains('404') || lower.contains('not found')) {
    return l10n.businessNotFound;
  }
  return l10n.businessLoadFailed;
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
      key: const Key('business_detail_hero_photo'),
      height: 310,
      child: Stack(
        fit: StackFit.expand,
        alignment: Alignment.topCenter,
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
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.55),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.28),
                ],
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  QalaGoSpacing.space16,
                  QalaGoSpacing.space8,
                  QalaGoSpacing.space16,
                  0,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _RoundIconButton(
                      key: const Key('business_detail_hero_back'),
                      icon: Icons.arrow_back_ios_new_rounded,
                      tooltip: context.l10n.commonBack,
                      onTap: onBack,
                    ),
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Spacer(),
                          Flexible(
                            child: Align(
                              alignment: Alignment.centerRight,
                              heightFactor: 1,
                              child: _CityPill(
                                key: const Key('business_detail_hero_city_pill'),
                                cityName: cityName,
                              ),
                            ),
                          ),
                          const SizedBox(width: QalaGoSpacing.space8),
                          _RoundIconButton(
                            key: const Key('business_detail_hero_favorite'),
                            icon: isFavorite
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            iconColor: isFavorite
                                ? QalaGoColors.favoriteActive
                                : QalaGoColors.textPrimary,
                            tooltip: isFavorite
                                ? context.l10n.favoritesRemoveTooltip
                                : context.l10n.businessFavoriteAddTooltip,
                            onTap: onFavorite,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
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
    return ColoredBox(
      color: QalaGoColors.surfaceSubtle,
      child: Center(
        child: Icon(
          Icons.storefront_outlined,
          size: 64,
          color: QalaGoColors.primary.withValues(alpha: 0.85),
        ),
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
      padding: const EdgeInsets.fromLTRB(
        QalaGoSpacing.space20,
        QalaGoSpacing.space20,
        QalaGoSpacing.space20,
        0,
      ),
      decoration: const BoxDecoration(
        color: QalaGoColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(QalaGoRadius.card),
        ),
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
        Text(
          title,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: QalaGoColors.textPrimary,
            height: 1.12,
          ),
          maxLines: 4,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: QalaGoSpacing.space12),
        _RatingPill(
          averageRating: averageRating,
          reviewCount: reviewCount,
        ),
        if (categoryTitle.isNotEmpty) ...[
          const SizedBox(height: QalaGoSpacing.space8),
          Text(
            categoryTitle,
            style: const TextStyle(
              color: QalaGoColors.textSecondary,
              fontSize: 16,
              fontWeight: FontWeight.w600,
              height: 1.25,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (openLabel.isNotEmpty) ...[
          const SizedBox(height: QalaGoSpacing.space12),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: QalaGoSpacing.space12,
              vertical: QalaGoSpacing.space8,
            ),
            decoration: BoxDecoration(
              color: openStatus == BusinessOpenStatus.open
                  ? QalaGoColors.openStatusBg
                  : QalaGoColors.closedStatusBg,
              borderRadius: BorderRadius.circular(QalaGoRadius.medium),
            ),
            child: Text(
              openLabel,
              style: TextStyle(
                color: openStatus == BusinessOpenStatus.open
                    ? QalaGoColors.openStatus
                    : QalaGoColors.closedStatus,
                fontWeight: FontWeight.w700,
                fontSize: 13,
                height: 1.2,
              ),
            ),
          ),
        ],
        if (address.isNotEmpty) ...[
          const SizedBox(height: QalaGoSpacing.space12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_on_outlined,
                color: QalaGoColors.textSecondary,
                size: 20,
              ),
              const SizedBox(width: QalaGoSpacing.space8),
              Expanded(
                child: Text(
                  address,
                  style: const TextStyle(
                    color: QalaGoColors.textSecondary,
                    fontSize: 15,
                    height: 1.35,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
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
    final l10n = context.l10n;
    final label = reviewCount == 0
        ? l10n.businessNoReviewsShort
        : averageRating!.toStringAsFixed(1);

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: QalaGoSpacing.space12,
          vertical: QalaGoSpacing.space8,
        ),
        decoration: BoxDecoration(
          color: QalaGoColors.primaryTint,
          borderRadius: BorderRadius.circular(QalaGoRadius.medium),
        ),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: QalaGoSpacing.space4,
          runSpacing: QalaGoSpacing.space4,
          children: [
            if (reviewCount > 0)
              const Icon(
                Icons.star_rounded,
                color: QalaGoColors.rating,
                size: 20,
              ),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: reviewCount == 0 ? 13 : 15,
                color: reviewCount == 0
                    ? QalaGoColors.textSecondary
                    : QalaGoColors.textPrimary,
                height: 1.15,
              ),
            ),
            if (reviewCount > 0)
              Text(
                '($reviewCount)',
                style: const TextStyle(
                  color: QalaGoColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
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
    final l10n = context.l10n;
    final children = <Widget>[];
    if (phone != null && normalizeTelUri(phone) != null) {
      children.add(
        _PrimaryAction(
          icon: Icons.phone_rounded,
          label: l10n.businessCall,
          onTap: onCall,
        ),
      );
    }
    if (whatsapp != null && normalizeWhatsAppUrl(whatsapp) != null) {
      children.add(
        _PrimaryAction(
          icon: Icons.chat_bubble_outline_rounded,
          label: 'WhatsApp',
          onTap: onWhatsApp,
        ),
      );
    }
    if (routeAvailable) {
      children.add(
        _PrimaryAction(
          icon: Icons.assistant_direction_rounded,
          label: l10n.businessRoute,
          onTap: onRoute,
        ),
      );
    }
    if (children.isEmpty) return const SizedBox.shrink();
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        final tileWidth = maxWidth > 240
            ? (maxWidth - QalaGoSpacing.space12) / 2
            : maxWidth;

        return Wrap(
          spacing: QalaGoSpacing.space12,
          runSpacing: QalaGoSpacing.space12,
          children: [
            for (final child in children)
              SizedBox(width: tileWidth, child: child),
          ],
        );
      },
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
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: QalaGoColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(QalaGoRadius.card),
        side: const BorderSide(color: QalaGoColors.borderSubtle),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(QalaGoRadius.card),
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            minHeight: QalaGoTouchTargets.minInteractive,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: QalaGoSpacing.space12,
              vertical: QalaGoSpacing.space12,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: QalaGoColors.primary, size: 26),
                const SizedBox(height: QalaGoSpacing.space8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  softWrap: true,
                  style: const TextStyle(
                    color: QalaGoColors.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    height: 1.15,
                  ),
                ),
              ],
            ),
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
        side: const BorderSide(color: AppTheme.primaryTintBorder),
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
        color: AppTheme.textDark,
      ),
    );
  }
}

class _PromotionTile extends StatelessWidget {
  const _PromotionTile({
    required this.localeCode,
    required this.promo,
    this.onTap,
  });

  final String localeCode;
  final Map<String, dynamic> promo;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final imageUrl = AppConstants.resolveMediaUrl(promo['imageUrl'] as String?);
    final title = promotionTitle(
      localeCode: localeCode,
      title: promo['title'] as String? ?? '',
      titleKk: promo['titleKk'] as String?,
    );
    final desc = promotionDescription(
          localeCode: localeCode,
          description: promo['description'] as String?,
          descriptionKk: promo['descriptionKk'] as String?,
        ) ??
        '';
    final discount = promo['discountText'] as String? ?? l10n.businessPromotionDefault;
    final endDateRaw = promo['endDate'];
    String? expiryLabel;
    if (endDateRaw != null) {
      final end = DateTime.tryParse(endDateRaw.toString());
      if (end != null) {
        final date =
            '${end.toLocal().day}.${end.toLocal().month}.${end.toLocal().year}';
        expiryLabel = l10n.businessPromotionValidUntil(date);
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
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textDark.withValues(alpha: 0.04),
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
                        color: AppTheme.textMuted,
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
                        color: AppTheme.textMuted,
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
      color: AppTheme.primaryTint,
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
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(title: l10n.businessSchedule),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceSubtle,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.schedule_rounded,
                    color: AppTheme.textMuted,
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
                      color: AppTheme.textMuted,
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
                                  : AppTheme.textMuted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            row.$2,
                            style: const TextStyle(
                              color: AppTheme.textMuted,
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
                color: AppTheme.primaryTint,
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
    final l10n = context.l10n;
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.reviewWriteRequired)),
      );
      return;
    }

    if (_analysis?.suggestedAction == 'reject') {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(l10n.reviewCheckTitle),
          content: Text(l10n.reviewCheckBody),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.reviewEdit),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(l10n.reviewSubmit),
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
    final l10n = context.l10n;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<int>(
            initialValue: widget.rating,
            decoration: InputDecoration(labelText: l10n.reviewRatingLabel),
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
            decoration: InputDecoration(labelText: l10n.reviewYourReviewLabel),
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
              child: Text(l10n.reviewLeaveButton),
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
    final l10n = context.l10n;
    final (color, icon, title) = switch (analysis.suggestedAction) {
      'approve' => (
          AppTheme.openStatus,
          Icons.check_circle_outline,
          l10n.reviewLooksOk,
        ),
      'reject' => (
          AppTheme.closedStatus,
          Icons.warning_amber_rounded,
          l10n.reviewPossibleViolations,
        ),
      _ => (
          AppSemanticColors.warning,
          Icons.info_outline,
          l10n.reviewRecommendCheck,
        ),
    };

    final detail = analysis.flags.isNotEmpty
        ? analysis.flags.first.message
        : l10n.reviewQualityScore(analysis.score);

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
                    color: AppTheme.textMuted,
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
    final l10n = context.l10n;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            l10n.reviewLoginToLeave,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.reviewLoginRequiredBody,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.35),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: onLogin, child: Text(l10n.commonLogin)),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.iconColor = Colors.black,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color iconColor;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: QalaGoColors.surface,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: QalaGoTouchTargets.heroControl,
          height: QalaGoTouchTargets.heroControl,
          child: Icon(icon, color: iconColor, size: 24),
        ),
      ),
    );
    if (tooltip == null || tooltip!.isEmpty) {
      return button;
    }
    return Tooltip(message: tooltip, child: button);
  }
}

class _CityPill extends StatelessWidget {
  const _CityPill({super.key, required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: QalaGoTouchTargets.minInteractive),
      padding: const EdgeInsets.symmetric(
        horizontal: QalaGoSpacing.space12,
        vertical: QalaGoSpacing.space8,
      ),
      decoration: BoxDecoration(
        color: QalaGoColors.surface,
        borderRadius: BorderRadius.circular(QalaGoRadius.card),
        boxShadow: [
          BoxShadow(
            color: QalaGoColors.textPrimary.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on, color: QalaGoColors.primary, size: 20),
          const SizedBox(width: QalaGoSpacing.space8),
          Flexible(
            child: Text(
              cityName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: QalaGoColors.textPrimary,
                height: 1.15,
              ),
            ),
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
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        QalaGoSectionHeader(title: l10n.businessContacts),
        const SizedBox(height: QalaGoSpacing.space12),
        if (phone != null && phone!.trim().isNotEmpty)
          _ContactRow(icon: Icons.phone_outlined, label: phone!.trim()),
        if (whatsapp != null && whatsapp!.trim().isNotEmpty)
          _ContactRow(icon: Icons.chat_bubble_outline, label: whatsapp!.trim()),
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
      padding: const EdgeInsets.only(bottom: QalaGoSpacing.space8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: QalaGoColors.surfaceSubtle,
          borderRadius: BorderRadius.circular(QalaGoRadius.medium),
          border: Border.all(color: QalaGoColors.borderSubtle),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: QalaGoSpacing.space12,
            vertical: QalaGoSpacing.space12,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: QalaGoColors.textSecondary),
              const SizedBox(width: QalaGoSpacing.space12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: QalaGoColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    height: 1.35,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
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
    final l10n = context.l10n;
    final coordinate = QalaGoMapCoordinate(
      latitude: latitude,
      longitude: longitude,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(title: l10n.businessOnMap),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: SizedBox(
            height: 160,
            child: QalaGoMapView(
              interactionEnabled: false,
              initialCamera: QalaGoMapCamera(center: coordinate, zoom: 15),
              markers: [
                QalaGoMapMarker(
                  id: 'business_location',
                  position: coordinate,
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
          ),
        ),
        if (onRoute != null) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: onRoute,
            icon: const Icon(Icons.directions_rounded),
            label: Text(l10n.businessBuildRoute),
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
