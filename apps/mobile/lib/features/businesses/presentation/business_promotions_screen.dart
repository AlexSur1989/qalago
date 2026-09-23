import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/utils/business_detail_utils.dart';
import '../../../core/locale/localized_content.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/utils/business_effective_catalog.dart';
import '../providers/business_catalog_provider.dart';

class BusinessPromotionsScreen extends ConsumerStatefulWidget {
  const BusinessPromotionsScreen({
    super.key,
    required this.businessId,
    this.locationId,
  });

  final String businessId;
  final String? locationId;

  @override
  ConsumerState<BusinessPromotionsScreen> createState() =>
      _BusinessPromotionsScreenState();
}

class _BusinessPromotionsScreenState extends ConsumerState<BusinessPromotionsScreen> {
  int _page = 1;
  final _items = <Map<String, dynamic>>[];
  Map<String, dynamic>? _pagination;
  bool _loadingMore = false;
  late String _scopeKey;

  @override
  void initState() {
    super.initState();
    _scopeKey = businessPromotionsScopeKey(
      businessId: widget.businessId,
      locationId: widget.locationId,
    );
  }

  @override
  void didUpdateWidget(BusinessPromotionsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextScope = businessPromotionsScopeKey(
      businessId: widget.businessId,
      locationId: widget.locationId,
    );
    if (oldWidget.businessId != widget.businessId ||
        oldWidget.locationId != widget.locationId) {
      _page = 1;
      _items.clear();
      _pagination = null;
      _loadingMore = false;
      _scopeKey = nextScope;
      ref.invalidate(businessPromotionsPageProvider(_pageOneQuery));
    }
  }

  BusinessPromotionsQuery get _pageOneQuery => BusinessPromotionsQuery(
        businessId: widget.businessId,
        page: 1,
        locationId: widget.locationId,
      );

  BusinessPromotionsQuery get _query => BusinessPromotionsQuery(
        businessId: widget.businessId,
        page: _page,
        locationId: widget.locationId,
      );

  Future<void> _reload() async {
    setState(() {
      _page = 1;
      _items.clear();
      _pagination = null;
    });
    ref.invalidate(businessPromotionsPageProvider(_pageOneQuery));
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _pagination == null) return;
    final totalPages = _pagination!['totalPages'] as int? ?? 0;
    final currentPage = _pagination!['page'] as int? ?? 1;
    if (currentPage >= totalPages) return;

    setState(() {
      _loadingMore = true;
      _page = currentPage + 1;
    });

    try {
      final data = await ref.read(businessPromotionsPageProvider(_query).future);
      if (!mounted) return;
      setState(() {
        _items.addAll(
          (data['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>(),
        );
        _pagination = data['pagination'] as Map<String, dynamic>?;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _loadingMore = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    assert(_scopeKey.isNotEmpty);
    final promotionsAsync = ref.watch(businessPromotionsPageProvider(_query));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.businessPromotionsOfBusiness),
        leading: qalagoBackLeading(
          context,
          fallbackLocation: '/business/${widget.businessId}',
        ),
      ),
      body: promotionsAsync.when(
        loading: () {
          if (_items.isNotEmpty) {
            return _PromotionsBody(
              businessId: widget.businessId,
              items: _items,
              pagination: _pagination,
              loadingMore: _loadingMore,
              onLoadMore: _loadMore,
              onRefresh: _reload,
            );
          }
          return const LoadingView();
        },
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: _reload,
        ),
        data: (data) {
          if (_page == 1 && _items.isEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              setState(() {
                _items
                  ..clear()
                  ..addAll(
                    (data['items'] as List<dynamic>? ?? [])
                        .cast<Map<String, dynamic>>(),
                  );
                _pagination = data['pagination'] as Map<String, dynamic>?;
              });
            });
          }

          final displayItems = _items.isEmpty
              ? filterActivePromotions(
                  (data['items'] as List<dynamic>? ?? []),
                )
              : filterActivePromotions(_items);

          return _PromotionsBody(
            businessId: widget.businessId,
            items: displayItems,
            pagination: _pagination ?? data['pagination'] as Map<String, dynamic>?,
            loadingMore: _loadingMore,
            onLoadMore: _loadMore,
            onRefresh: _reload,
          );
        },
      ),
    );
  }
}

class _PromotionsBody extends StatelessWidget {
  const _PromotionsBody({
    required this.businessId,
    required this.items,
    required this.pagination,
    required this.loadingMore,
    required this.onLoadMore,
    required this.onRefresh,
  });

  final String businessId;
  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? pagination;
  final bool loadingMore;
  final VoidCallback onLoadMore;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final total = pagination?['total'] as int? ?? items.length;
    final page = pagination?['page'] as int? ?? 1;
    final totalPages = pagination?['totalPages'] as int? ?? 0;
    final canLoadMore = page < totalPages;

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Text(
                  l10n.businessPromotionsEmpty,
                  style: const TextStyle(color: AppTheme.textMuted),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else ...[
            Text(
              l10n.promotionsFoundCount(total),
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 8),
            for (final promo in items)
              _BusinessPromotionCard(
                promo: promo,
                localeCode: Localizations.localeOf(context).languageCode,
              ),
            if (canLoadMore)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Center(
                  child: loadingMore
                      ? const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : TextButton(
                          onPressed: onLoadMore,
                          child: Text(l10n.catalogShowMore),
                        ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _BusinessPromotionCard extends StatelessWidget {
  const _BusinessPromotionCard({
    required this.promo,
    required this.localeCode,
  });

  final Map<String, dynamic> promo;
  final String localeCode;

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

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
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
                    errorBuilder: (_, __, ___) => _OfferPlaceholder(),
                  )
                : _OfferPlaceholder(),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    discount,
                    style: const TextStyle(
                      color: AppTheme.kzBlue,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  if (desc.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      desc,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ],
              ),
            ),
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
      color: AppTheme.primaryTint,
      child: const Icon(Icons.local_offer_rounded, color: AppTheme.kzBlue),
    );
  }
}
