import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/business_catalog_provider.dart';
import 'business_photos_gallery_state.dart';

class BusinessPhotosScreen extends ConsumerStatefulWidget {
  const BusinessPhotosScreen({
    super.key,
    required this.businessId,
    this.locationId,
  });

  final String businessId;
  final String? locationId;

  @override
  ConsumerState<BusinessPhotosScreen> createState() =>
      _BusinessPhotosScreenState();
}

class _BusinessPhotosScreenState extends ConsumerState<BusinessPhotosScreen> {
  int _page = 1;
  final _accumulatedItems = <Map<String, dynamic>>[];
  Map<String, dynamic>? _pagination;
  bool _loadingMore = false;
  late String _scopeKey;

  BusinessPhotosQuery get _query => BusinessPhotosQuery(
        businessId: widget.businessId,
        page: _page,
        locationId: widget.locationId,
      );

  BusinessPhotosQuery get _pageOneQuery => BusinessPhotosQuery(
        businessId: widget.businessId,
        page: 1,
        locationId: widget.locationId,
      );

  @override
  void initState() {
    super.initState();
    _scopeKey = businessPhotosScopeKey(
      businessId: widget.businessId,
      locationId: widget.locationId,
    );
  }

  @override
  void didUpdateWidget(BusinessPhotosScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextScope = businessPhotosScopeKey(
      businessId: widget.businessId,
      locationId: widget.locationId,
    );
    if (oldWidget.businessId != widget.businessId ||
        oldWidget.locationId != widget.locationId) {
      _resetLocalGalleryState();
      _scopeKey = nextScope;
      ref.invalidate(businessPhotosPageProvider(_pageOneQuery));
    }
  }

  void _resetLocalGalleryState() {
    _page = 1;
    _accumulatedItems.clear();
    _pagination = null;
    _loadingMore = false;
  }

  Future<void> _reload() async {
    _resetLocalGalleryState();
    ref.invalidate(businessPhotosPageProvider(_query));
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _pagination == null) return;
    final totalPages = _pagination!['totalPages'] as int? ?? 0;
    final currentPage = _pagination!['page'] as int? ?? 1;
    if (currentPage >= totalPages) return;

    if (_accumulatedItems.isEmpty) {
      final pageOne =
          ref.read(businessPhotosPageProvider(_pageOneQuery)).valueOrNull;
      if (pageOne != null) {
        _accumulatedItems.addAll(
          (pageOne['items'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>(),
        );
      }
    }

    final nextPage = currentPage + 1;
    setState(() {
      _loadingMore = true;
      _page = nextPage;
    });

    try {
      final data = await ref.read(
        businessPhotosPageProvider(
          BusinessPhotosQuery(
            businessId: widget.businessId,
            page: nextPage,
            locationId: widget.locationId,
          ),
        ).future,
      );
      if (!mounted) return;
      setState(() {
        _accumulatedItems.addAll(
          (data['items'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>(),
        );
        _pagination = data['pagination'] as Map<String, dynamic>?;
        _loadingMore = false;
        _page = nextPage;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingMore = false;
          _page = currentPage;
        });
      }
    }
  }

  void _openFullscreen(List<Map<String, dynamic>> items, int index) {
    final urls = items
        .map((item) => AppConstants.resolveMediaUrl(item['imageUrl'] as String?))
        .where((url) => url.isNotEmpty)
        .toList();
    if (urls.isEmpty) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _FullscreenGallery(
          urls: urls,
          initialIndex: index.clamp(0, urls.length - 1),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final photosAsync = ref.watch(businessPhotosPageProvider(_query));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.businessPhotos),
        leading: qalagoBackLeading(
          context,
          fallbackLocation: '/business/${widget.businessId}',
        ),
      ),
      body: photosAsync.when(
        loading: () => _page == 1 && _accumulatedItems.isEmpty
            ? const LoadingView()
            : _buildGrid(_accumulatedItems),
        error: (e, _) => ErrorView(message: '$e', onRetry: _reload),
        data: (data) {
          final providerItems = (data['items'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
          final displayItems = resolveBusinessPhotosDisplayItems(
            page: _page,
            providerPageItems: providerItems,
            accumulatedItems: _accumulatedItems,
          );
          _pagination ??= data['pagination'] as Map<String, dynamic>?;
          if (_page == 1) {
            _pagination = data['pagination'] as Map<String, dynamic>?;
          }

          return _PhotosGridBody(
            items: displayItems,
            pagination: _pagination,
            loadingMore: _loadingMore,
            scopeKey: _scopeKey,
            onReload: _reload,
            onLoadMore: _loadMore,
            onTap: (index) => _openFullscreen(displayItems, index),
          );
        },
      ),
    );
  }

  Widget _buildGrid(List<Map<String, dynamic>> items) {
    return _PhotosGridBody(
      items: items,
      pagination: _pagination,
      loadingMore: _loadingMore,
      scopeKey: _scopeKey,
      onReload: _reload,
      onLoadMore: _loadMore,
      onTap: (index) => _openFullscreen(items, index),
    );
  }
}

class _PhotosGridBody extends StatelessWidget {
  const _PhotosGridBody({
    required this.items,
    required this.pagination,
    required this.loadingMore,
    required this.scopeKey,
    required this.onReload,
    required this.onLoadMore,
    required this.onTap,
  });

  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? pagination;
  final bool loadingMore;
  final String scopeKey;
  final Future<void> Function() onReload;
  final VoidCallback onLoadMore;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final totalCount = pagination?['total'] as int? ?? items.length;
    final page = pagination?['page'] as int? ?? 1;
    final totalPages = pagination?['totalPages'] as int? ?? 0;
    final canLoadMore = page < totalPages;

    if (items.isEmpty) {
      return Center(child: Text(l10n.photosEmpty));
    }

    return RefreshIndicator(
      color: AppTheme.kzBlue,
      onRefresh: onReload,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                l10n.photosTotal(totalCount),
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final row = items[index];
                  final url = AppConstants.resolveMediaUrl(
                    row['imageUrl'] as String?,
                  );
                  final rowId = row['id'] as String? ?? url;
                  return GestureDetector(
                    onTap: () => onTap(index),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        url,
                        key: ValueKey('$scopeKey|$rowId'),
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: AppTheme.primaryTint,
                          child: const Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    ),
                  );
                },
                childCount: items.length,
              ),
            ),
          ),
          if (canLoadMore)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: OutlinedButton(
                  onPressed: loadingMore ? null : onLoadMore,
                  child: loadingMore
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.catalogShowMore),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FullscreenGallery extends StatefulWidget {
  const _FullscreenGallery({
    required this.urls,
    required this.initialIndex,
  });

  final List<String> urls;
  final int initialIndex;

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: true,
        title: Text('${_index + 1} / ${widget.urls.length}'),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.urls.length,
        onPageChanged: (value) => setState(() => _index = value),
        itemBuilder: (context, index) {
          return InteractiveViewer(
            child: Center(
              child: Image.network(
                widget.urls[index],
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) =>
                    const Icon(Icons.broken_image_outlined, color: Colors.white),
              ),
            ),
          );
        },
      ),
      ),
    );
  }
}
